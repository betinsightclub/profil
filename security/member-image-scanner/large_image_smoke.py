"""High-resolution synthetic test, no real member images."""
import gc
import hashlib
import io
import resource
from PIL import Image
from scanner import inspect, Rejected, MAX_BYTES, MAX_PIXELS
assert MAX_PIXELS == 60_000_000
for fmt, mime, mode, color, opts in [
 ("JPEG","image/jpeg","RGB",(23,120,200),{"quality":85}),
 ("PNG","image/png","RGBA",(23,120,200,127),{}),
 ("WEBP","image/webp","RGBA",(23,120,200,127),{"quality":85,"method":0})
]:
    with Image.new(mode,(10000,6000),color) as im:
        with io.BytesIO() as b:
            im.save(b,format=fmt,**opts)
            data=b.getvalue()
    gc.collect()
    assert 0<len(data)<=MAX_BYTES, "fixture too big"
    result=inspect(data,mime,("betinsight-clamav",3310))
    assert result["width"]==10000 and result["height"]==6000
    assert result["sha256"]==hashlib.sha256(data).hexdigest()
    print(fmt+" 60 MP: CLEAN | bytes="+str(len(data))+" | peak MiB="+str(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss//1024),flush=True)
    del data; gc.collect()
print("60 MP CAPACITY TEST: PASS (3/3)",flush=True)
