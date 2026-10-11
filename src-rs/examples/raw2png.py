import struct
import zlib

W, H = 96, 96
raw = open('dump.raw', 'rb').read()
assert len(raw) == W * H * 3, len(raw)


def chunk(t, d):
    return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xFFFFFFFF)


ihdr = struct.pack('>IIBBBBB', W, H, 8, 2, 0, 0, 0)
rows = b''.join(b'\x00' + raw[y * W * 3:(y + 1) * W * 3] for y in range(H))
png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b'')
open('dump.png', 'wb').write(png)
print('png ok')
