"""One synthetic roundtrip, no member data, no public port, no privileged DB key."""
import hashlib
import json
import re
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from scanner import inspect

HOST = "lszlaglwlixejzytrurg.supabase.co"
API = "https://" + HOST + "/functions/v1/member-image-worker-pilot"
CLAMD = ("betinsight-clamav", 3310)
EXPECTED_SHA = "a7f58263473f22be9b3967db4fb23ac72e58b9012fdbb54cd270cffd80b95c91"

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())

def read_clamd(command):
    with socket.create_connection(CLAMD, timeout=10) as s:
        s.sendall(b"z" + command + b"\0")
        reply = bytearray()
        while len(reply) < 1024:
            block = s.recv(1024-len(reply))
            if not block:
                break
            reply.extend(block)
            if b"\0" in reply:
                break
        if not reply.endswith(b"\0"):
            raise RuntimeError("INCOMPLETE_CLAMD_RESPONSE")
        return bytes(reply[:-1]).decode("ascii", errors="strict")

def version():
    info = read_clamd(b"VERSION")
    m = re.match(r"^ClamAV [^/]+/(\d+)/", info)
    if not m:
        raise RuntimeError("INVALID_CLAMD_VERSION")
    return int(m.group(1)), info

def api(action, key, report=None, expected=200):
    data = json.dumps(report).encode() if report is not None else b""
    req = urllib.request.Request(API, data=data, method="POST", headers={
        "Content-Type": "application/json",
        "x-betinsight-worker-key": key,
        "x-betinsight-worker-action": action,
    })
    try:
        with opener.open(req, timeout=25) as res:
            code = res.status
            raw = res.read(8193)
    except urllib.error.HTTPError as exc:
        code = exc.code
        raw = exc.read(8193)
    if len(raw)>8192:
        raise RuntimeError("OVERSIZE_API_REPLY")
    result = json.loads(raw)
    print(action + ": HTTP " + str(code), flush=True)
    if code != expected:
        err = result.get("error", "")
        if not isinstance(err, str) or not re.fullmatch(r"[A-Z0-9_]{1,80}",err):
            err = "UNEXPECTED_RESPONSE"
        raise RuntimeError(action + ": " + err)
    return result

def main():
    raw = sys.stdin.buffer.read(66)
    if not re.fullmatch(b"[0-9a-f]{64}\n", raw):
        raise RuntimeError("INVALID_KEY_FILE")
    key = raw[:-1].decode("ascii")
    db, info = version()
    print("CLAMD ACTIVE:", info, flush=True)
    if db < 28187:
        response = read_clamd(b"RELOAD")
        if response != "RELOADING":
            raise RuntimeError("CLAMD_RELOAD_NOT_ACCEPTED")
        for _ in range(30):
            time.sleep(3)
            db, info = version()
            if db >= 28187:
                break
        print("CLAMD AFTER RELOAD:", info, flush=True)
    if db < 28187:
        raise RuntimeError("ACTIVE_SIGNATURE_DATABASE_STALE")
    reply = api("claim_test",key)
    job=reply["job"]
    if job["id"]!="pilot-fixture-v1" or job["sha256"]!=EXPECTED_SHA or job["mime"]!="image/png" or job["bytes"]!=140:
        raise RuntimeError("UNEXPECTED_JOB")
    url=job["download_url"]
    parts=urllib.parse.urlsplit(url)
    if parts.scheme!="https" or parts.netloc!=HOST or parts.path!="/storage/v1/object/sign/member-image-scan-pilot/fixture-v1.png" or not parts.query or parts.fragment:
        raise RuntimeError("UNEXPECTED_DOWNLOAD_DESTINATION")
    # Never transmit worker key to the signed storage endpoint.
    with opener.open(urllib.request.Request(url),timeout=25) as res:
        data=res.read(1025)
    if len(data)!=140 or hashlib.sha256(data).hexdigest()!=EXPECTED_SHA:
        raise RuntimeError("FIXTURE_HASH_MISMATCH")
    print("PRIVATE STORAGE DOWNLOAD + SHA256: OK",flush=True)
    report=inspect(data,job["mime"],CLAMD)
    report.update(id=job["id"],database_version=db)
    print("PILLOW + CLAMAV: OK",flush=True)
    bad=api("report_test",key,{**report,"sha256":"0"*64},expected=422)
    if bad.get("error")!="TEST_RESULT_MISMATCH":
        raise RuntimeError("INVALID_NEGATIVE_TEST")
    print("WRONG HASH REJECTED: OK",flush=True)
    result=api("report_test",key,report)
    if result.get("verified")!=job["id"] or result.get("cleanup") is not True:
        raise RuntimeError("RESULT_NOT_CONFIRMED")
    print("SUPABASE RESULT + PRIVATE TEST FILE CLEANUP: OK",flush=True)
    print("BETINSIGHT SCAN ROUNDTRIP: PASS",flush=True)

if __name__=="__main__":
    try:
        main()
    except Exception as exc:
        # URL exceptions may contain signed URLs. Print only explicitly generated safe errors.
        print("ROUNDTRIP FAILED:", str(exc) if type(exc) is RuntimeError else type(exc).__name__,file=sys.stderr)
        sys.exit(1)
