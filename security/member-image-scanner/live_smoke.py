"""Synthetic image smoke test against the user's actual private ClamAV container."""
import io
import hashlib
import json
from PIL import Image
from scanner import inspect, Rejected

ENDPOINT = ("betinsight-clamav", 3310)
for fmt, mime in [("JPEG", "image/jpeg"), ("PNG", "image/png"), ("WEBP", "image/webp")]:
    buf = io.BytesIO()
    Image.new("RGB", (64, 48), (23, 120, 200)).save(buf, format=fmt)
    data = buf.getvalue()
    result = inspect(data, mime, ENDPOINT)
    assert result["sha256"] == hashlib.sha256(data).hexdigest()
    assert result["width"] == 64 and result["height"] == 48 and result["clamav"] == "clean"
    print(fmt + " DECODE + CLAMAV: OK")
    try:
        inspect(data[:len(data)//2], mime, ENDPOINT)
    except Rejected as exc:
        print(fmt + " TRUNCATED: REJECTED (" + str(exc) + ")")
    else:
        raise RuntimeError(fmt + " truncated image was accepted")
try:
    inspect(b'{"fake":"image"}', "image/png", ENDPOINT)
except Rejected as exc:
    print("DISGUISED JSON: REJECTED (" + str(exc) + ")")
else:
    raise RuntimeError("Disguised JSON was accepted")
print("LIVE IMAGE SCANNER PILOT: PASS (7/7)")
