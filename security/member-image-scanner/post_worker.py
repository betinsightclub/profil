"""Post-scan queue worker. Production remains gated by the Supabase endpoint."""
import hashlib
import re
import urllib.parse
import urllib.request
import time
import json
import sys
from pathlib import Path
import queue_worker as core
from scanner import inspect, Rejected, MAX_PIXELS

core.API = "https://" + core.HOST + "/functions/v1/member-image-worker-post"
MIME_EXT={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}
SAFE_OWNER=re.compile(r"^[A-Za-z0-9_@.:-]{1,80}$")
SAFE_REJECTS={"DECODE_FAILED","DIMENSION_LIMIT","ANIMATION_UNSUPPORTED","TYPE_OR_SIZE","DIMENSION_MISMATCH","SCAN_NOT_CLEAN"}

def run_once(key):
    db=core.clamd_version()
    response=core.api("claim",key)
    job=response.get("job")
    if job is None: return False
    jid=job.get("id","")
    lease=job.get("lease_token","")
    kind=job.get("kind")
    path=job.get("path","")
    mime=job.get("mime")
    size=job.get("bytes")
    sha=job.get("sha256","")
    if not core.UUID.fullmatch(jid) or not core.UUID.fullmatch(lease) or mime not in MIME_EXT or type(size) is not int or not 0<size<=8_000_000 or not re.fullmatch(r"[a-f0-9]{64}",sha):
        raise RuntimeError("INVALID_JOB")
    if kind=="test":
        bucket="member-image-scan-pilot"
        if path!="post-v2/"+jid+".png" or sha!=core.SHA or size!=140 or mime!="image/png":
            raise RuntimeError("INVALID_TEST_JOB")
    elif kind=="post":
        bucket="community-media-pending"
        fields=path.split("/")
        if len(fields)!=3 or not SAFE_OWNER.fullmatch(fields[0]) or fields[0] in (".","..") or fields[1]!="post" or not fields[2].endswith("."+MIME_EXT[mime]) or not core.UUID.fullmatch(fields[2].split(".")[0]) or fields[2]!=fields[2].split(".")[0]+"."+MIME_EXT[mime]:
            raise RuntimeError("INVALID_POST_PATH")
    else: raise RuntimeError("INVALID_KIND")
    parts=urllib.parse.urlsplit(job["download_url"])
    if parts.scheme!="https" or parts.netloc!=core.HOST or urllib.parse.unquote(parts.path)!="/storage/v1/object/sign/"+bucket+"/"+path or not parts.query or parts.fragment:
        raise RuntimeError("INVALID_DOWNLOAD_DESTINATION")
    with core.opener.open(urllib.request.Request(job["download_url"]),timeout=25) as res:
        data=res.read(size+1)
    if len(data)!=size or hashlib.sha256(data).hexdigest()!=sha:
        raise RuntimeError("IMAGE_HASH_MISMATCH")
    identity={"id":jid,"lease_token":lease,"sha256":sha,"bytes":size,"mime":mime}
    try:
        result=inspect(data,mime,core.CLAMD)
        if result["width"]!=job["width"] or result["height"]!=job["height"]:
            raise Rejected("DIMENSION_MISMATCH")
        result.update(identity,database_version=core.clamd_version())
    except Rejected as exc:
        reason=str(exc)
        if kind=="test" or reason not in SAFE_REJECTS:
            raise
        result={**identity,"ok":False,"reason":reason}
    ack=core.api("report",key,result)
    expected="clean" if result["ok"] else "rejected"
    if ack.get("verified")!=jid or ack.get("status")!=expected or (kind=="test" and ack.get("cleanup") is not True):
        raise RuntimeError("REPORT_NOT_CONFIRMED")
    print("POST SCAN "+expected.upper()+" | kind="+kind+" | "+jid+" | signatures="+str(db),flush=True)
    return True

def main():
    key=core.KEY_FILE.read_bytes()
    if not re.fullmatch(b"[a-f0-9]{64}\n",key):
        raise RuntimeError("INVALID_WORKER_KEY_FILE")
    key=key[:-1].decode("ascii")
    if MAX_PIXELS != 60_000_000:
        raise RuntimeError("WRONG_SCANNER_PIXEL_LIMIT")
    print("BETINSIGHT POST WORKER STARTED | 60 MP | idle polling 30s",flush=True)
    failures=0
    while True:
        try:
            worked=run_once(key)
            if failures: print("WORKER CONNECTION RECOVERED",flush=True)
            failures=0
            time.sleep(1 if worked else 30)
        except Exception as exc:
            failures+=1
            safe=str(exc) if type(exc) is RuntimeError and re.fullmatch(r"[A-Z0-9_]{1,100}",str(exc)) else type(exc).__name__
            print("POST WORKER RETRY | "+safe,flush=True)
            time.sleep(min(300,30*failures))

if __name__=="__main__":
    main()
