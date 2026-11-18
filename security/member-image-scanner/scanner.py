"""Isolated scanner pilot. No network service, storage writes or member data access."""
import argparse
import hashlib
import io
import json
import socket
import struct
import sys
import time
import warnings
from PIL import Image, ImageFile

MAX_BYTES = 8_000_000
MAX_PIXELS = 24_000_000  # pilot only; production limit remains unchanged
MAX_SIDE = 12_000
TYPES = {"image/jpeg": "JPEG", "image/png": "PNG", "image/webp": "WEBP"}
Image.MAX_IMAGE_PIXELS = MAX_PIXELS
ImageFile.LOAD_TRUNCATED_IMAGES = False

class Rejected(Exception):
    pass

def decode_image(data: bytes, mime: str):
    if not 0 < len(data) <= MAX_BYTES or mime not in TYPES:
        raise Rejected("TYPE_OR_SIZE")
    fmt = TYPES[mime]
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(io.BytesIO(data), formats=[fmt]) as im:
                w, h = im.size
                if not (0 < w <= MAX_SIDE and 0 < h <= MAX_SIDE and w*h <= MAX_PIXELS):
                    raise Rejected("DIMENSION_LIMIT")
                if getattr(im, "n_frames", 1) != 1:
                    raise Rejected("ANIMATION_UNSUPPORTED")
                im.verify()
            with Image.open(io.BytesIO(data), formats=[fmt]) as im:
                if im.size != (w, h):
                    raise Rejected("DIMENSION_MISMATCH")
                im.load()
                metadata = sorted(set(im.info) & {"exif", "icc_profile", "xmp", "comment", "XML:com.adobe.xmp"})
        return {"width": w, "height": h, "mime": mime, "metadata": metadata}
    except Rejected:
        raise
    except Exception as exc:
        raise Rejected("DECODE_FAILED") from exc

def scan_clamd(data: bytes, socket_path: str | tuple[str, int], timeout=20):
    # No path supplied by an uploader is ever passed to clamd.
    deadline = time.monotonic() + timeout
    def remain():
        t = deadline - time.monotonic()
        if t <= 0:
            raise TimeoutError()
        return t
    try:
        with socket.socket(socket.AF_INET if isinstance(socket_path, tuple) else socket.AF_UNIX, socket.SOCK_STREAM) as sock:
            sock.settimeout(remain())
            sock.connect(socket_path)
            sock.sendall(b"zINSTREAM\0")
            for pos in range(0, len(data), 65536):
                chunk = data[pos:pos+65536]
                sock.settimeout(remain())
                sock.sendall(struct.pack("!I", len(chunk)) + chunk)
            sock.settimeout(remain())
            sock.sendall(b"\0\0\0\0")
            response = bytearray()
            while len(response) < 4096:
                sock.settimeout(remain())
                block = sock.recv(4096-len(response))
                if not block:
                    break
                response.extend(block)
                if b"\0" in response:
                    break
        if bytes(response) != b"stream: OK\0":
            raise Rejected("SCAN_NOT_CLEAN")
    except Rejected:
        raise
    except OSError as exc:
        raise Rejected("SCAN_UNAVAILABLE") from exc

def inspect(data: bytes, mime: str, socket_path: str | tuple[str, int]):
    decoded = decode_image(data, mime)
    scan_clamd(data, socket_path)
    return {"ok": True, "sha256": hashlib.sha256(data).hexdigest(),
            "bytes": len(data), **decoded, "clamav": "clean"}

def main():
    p = argparse.ArgumentParser(description="Scan exactly one member image from stdin")
    p.add_argument("--mime", required=True, choices=TYPES)
    p.add_argument("--clamd-socket", default="/run/clamav/clamd.ctl")
    p.add_argument("--clamd-docker", action="store_true", help="Use the fixed private Docker network endpoint")
    args = p.parse_args()
    endpoint = ("betinsight-clamav", 3310) if args.clamd_docker else args.clamd_socket
    try:
        print(json.dumps(inspect(sys.stdin.buffer.read(MAX_BYTES+1), args.mime, endpoint)))
        return 0
    except Rejected as exc:
        print(json.dumps({"ok": False, "error": str(exc)}))
        return 1
    except Exception:
        print(json.dumps({"ok": False, "error": "SCANNER_FAILURE"}))
        return 2
if __name__ == "__main__":
    sys.exit(main())
