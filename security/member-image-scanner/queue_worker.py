"""Outbound-only, isolated persistent synthetic image scan worker."""
import datetime as dt
import hashlib
import json
import re
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from scanner import inspect

HOST = "lszlaglwlixejzytrurg.supabase.co"
API = "https://" + HOST + "/functions/v1/member-image-worker-queue"
CLAMD = ("betinsight-clamav", 3310)
KEY_FILE = Path("/run/betinsight/worker.key")
SHA = "a7f58263473f22be9b3967db4fb23ac72e58b9012fdbb54cd270cffd80b95c91"
UUID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())

def clamd_version():
    with socket.create_connection(CLAMD, timeout=10) as sock:
        sock.sendall(b"zVERSION\0")
        out=bytearray()
        while len(out)<1024:
            block=sock.recv(1024-len(out))
            if not block: break
            out.extend(block)
            if b"\0" in out: break
    if not out.endswith(b"\0"):
        raise RuntimeError("INCOMPLETE_CLAMD_VERSION")
    m=re.fullmatch(r"ClamAV [^/]+/(\d+)/(.+)",out[:-1].decode("ascii"))
    if not m: raise RuntimeError("BAD_CLAMD_VERSION")
    version=int(m.group(1))
    stamp=dt.datetime.strptime(m.group(2),"%a %b %d %H:%M:%S %Y").replace(tzinfo=dt.timezone.utc)
    age=(dt.datetime.now(dt.timezone.utc)-stamp).total_seconds()
    if version<28187 or age < -3600 or age>72*3600:
        raise RuntimeError("CLAMD_DATABASE_STALE")
    return version

def api(action, key, report=None):
    body=json.dumps(report).encode() if report is not None else b""
    req=urllib.request.Request(API,data=body,method="POST",headers={
      "Content-Type":"application/json","x-betinsight-worker-key":key,
      "x-betinsight-worker-action":action})
    try:
        with opener.open(req,timeout=25) as res: raw=res.read(8193)
    except urllib.error.HTTPError as exc:
        raise RuntimeError("QUEUE_HTTP_"+str(exc.code)) from None
    if len(raw)>8192: raise RuntimeError("OVERSIZE_QUEUE_REPLY")
    reply=json.loads(raw)
    if reply.get("ok") is not True: raise RuntimeError("QUEUE_NOT_OK")
    return reply

def run_once(key):
    db=clamd_version()
    job=api("claim",key).get("job")
    if job is None: return False
    jid=job.get("id","")
    lease=job.get("lease_token","")
    if not UUID.fullmatch(jid) or not UUID.fullmatch(lease) or job.get("sha256")!=SHA or job.get("mime")!="image/png" or job.get("bytes")!=140:
        raise RuntimeError("INVALID_PILOT_JOB")
    parts=urllib.parse.urlsplit(job["download_url"])
    if parts.scheme!="https" or parts.netloc!=HOST or parts.path!="/storage/v1/object/sign/member-image-scan-pilot/queue/"+jid+".png" or not parts.query or parts.fragment:
        raise RuntimeError("INVALID_DOWNLOAD_DESTINATION")
    with opener.open(urllib.request.Request(job["download_url"]),timeout=25) as res:
        data=res.read(1025)
    if len(data)!=140 or hashlib.sha256(data).hexdigest()!=SHA:
        raise RuntimeError("IMAGE_HASH_MISMATCH")
    result=inspect(data,job["mime"],CLAMD)
    db=clamd_version()
    result.update(id=jid,lease_token=lease,database_version=db)
    ack=api("report",key,result)
    if ack.get("verified")!=jid or ack.get("cleanup") is not True:
        raise RuntimeError("QUEUE_REPORT_NOT_CONFIRMED")
    print("PILOT JOB CLEAN | "+jid+" | signatures="+str(db),flush=True)
    return True

def main():
    key=KEY_FILE.read_bytes()
    if not re.fullmatch(b"[a-f0-9]{64}\n",key):
        raise RuntimeError("INVALID_WORKER_KEY_FILE")
    key=key[:-1].decode("ascii")
    print("BETINSIGHT QUEUE WORKER STARTED | pilot-only | idle polling 30s",flush=True)
    failures=0
    while True:
        try:
            worked=run_once(key)
            if failures:
                print("WORKER CONNECTION RECOVERED",flush=True)
            failures=0
            time.sleep(1 if worked else 30)
        except Exception as exc:
            failures+=1
            # Prevent accidentally logging signed URLs or any credentials.
            safe=str(exc) if type(exc) is RuntimeError and re.fullmatch(r"[A-Z0-9_]{1,100}",str(exc)) else type(exc).__name__
            print("WORKER RETRY | "+safe,flush=True)
            time.sleep(min(300,30*failures))

if __name__=="__main__":
    main()
