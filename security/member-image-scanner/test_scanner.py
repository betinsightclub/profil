import hashlib
import io
import socket
import struct
import tempfile
import threading
import unittest
from pathlib import Path
from PIL import Image
from scanner import decode_image, inspect, Rejected, scan_clamd, MAX_BYTES

def photo(fmt, **kw):
    out = io.BytesIO()
    Image.new("RGB", (64, 48), (12, 100, 180)).save(out, format=fmt, **kw)
    return out.getvalue()

def read_exact(conn, size):
    result = bytearray()
    while len(result) < size:
        chunk = conn.recv(size-len(result))
        if not chunk:
            raise EOFError()
        result.extend(chunk)
    return bytes(result)

class Tests(unittest.TestCase):
    def test_real_decoding(self):
        for fmt, mime in [("JPEG","image/jpeg"),("PNG","image/png"),("WEBP","image/webp")]:
            with self.subTest(fmt=fmt):
                data=photo(fmt)
                self.assertEqual(decode_image(data,mime)["width"],64)
                with self.assertRaises(Rejected):
                    decode_image(data,"image/png" if fmt!="PNG" else "image/jpeg")
                with self.assertRaises(Rejected):
                    decode_image(data[:len(data)//2],mime)
    def test_disguised(self):
        for data in [b'{"name":"test"}',b"<svg></svg>",b"<html>test</html>"]:
            with self.assertRaises(Rejected):
                decode_image(data,"image/png")
    def test_size(self):
        with self.assertRaises(Rejected):
            decode_image(b"a"*(MAX_BYTES+1),"image/png")
    def test_animation(self):
        out=io.BytesIO()
        first=Image.new("RGB",(64,48),"red")
        first.save(out,"PNG",save_all=True,append_images=[Image.new("RGB",(64,48),"blue")],duration=100)
        with self.assertRaisesRegex(Rejected,"ANIMATION_UNSUPPORTED"):
            decode_image(out.getvalue(),"image/png")
    def check_daemon(self,response,expected_clean):
        data=photo("PNG")
        with tempfile.TemporaryDirectory() as tmp:
            path=str(Path(tmp)/"clam.sock")
            with socket.socket(socket.AF_UNIX,socket.SOCK_STREAM) as server:
                server.bind(path)
                server.listen(1)
                received=[]
                def fake_daemon():
                    with server.accept()[0] as conn:
                        if read_exact(conn,10)!=b"zINSTREAM\0":
                            return
                        parts=[]
                        while True:
                            length=struct.unpack("!I",read_exact(conn,4))[0]
                            if not length: break
                            parts.append(read_exact(conn,length))
                        received.append(b"".join(parts))
                        conn.sendall(response)
                thread=threading.Thread(target=fake_daemon,daemon=True)
                thread.start()
                if expected_clean:
                    result=inspect(data,"image/png",path)
                    self.assertTrue(result["ok"])
                    self.assertEqual(result["sha256"],hashlib.sha256(data).hexdigest())
                else:
                    with self.assertRaises(Rejected):
                        inspect(data,"image/png",path)
                thread.join(3)
                self.assertFalse(thread.is_alive())
                self.assertEqual(received,[data])
    def test_clean_daemon_reply(self): self.check_daemon(b"stream: OK\0",True)
    def test_detected(self): self.check_daemon(b"stream: Test-Signature FOUND\0",False)
    def test_error(self): self.check_daemon(b"stream: limit exceeded ERROR\0",False)
    def test_incomplete(self): self.check_daemon(b"stream: OK",False)
    def test_unavailable(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaisesRegex(Rejected,"SCAN_UNAVAILABLE"):
                scan_clamd(photo("PNG"),str(Path(tmp)/"missing.sock"))
if __name__ == "__main__":
    unittest.main()
