import zlib
import struct
import base64
import os
import re

def create_png(width, height, pixels):
    def make_chunk(chunk_type, data):
        return struct.pack('>I', len(data)) + chunk_type + data + struct.pack('>I', zlib.crc32(chunk_type + data) & 0xffffffff)

    header = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_chunk = make_chunk(b'IHDR', ihdr)

    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)
        for x in range(width):
            r, g, b, a = pixels[y * width + x]
            raw_data.extend([r, g, b, a])

    idat_chunk = make_chunk(b'IDAT', zlib.compress(bytes(raw_data)))
    iend_chunk = make_chunk(b'IEND', b'')

    return header + ihdr_chunk + idat_chunk + iend_chunk

# 1. Rương Đồng / Gold Chest (#F59E0B)
def gen_bronze():
    w, h = 32, 32
    pixels = []
    for y in range(h):
        for x in range(w):
            if 1 <= x <= 30 and 2 <= y <= 29:
                if x in (1, 30) or y in (2, 29):
                    pixels.append((180, 83, 9, 255))
                elif 11 <= y <= 13:
                    pixels.append((146, 64, 14, 255))
                elif 12 <= x <= 19 and 14 <= y <= 21:
                    pixels.append((254, 240, 138, 255)) # Bright Gold Lock
                elif (6 <= x <= 8 or 23 <= x <= 25) and not (11 <= y <= 13):
                    pixels.append((180, 83, 9, 255))
                else:
                    shade = 0.85 if y > 13 else 1.1
                    pixels.append((min(255, int(245 * shade)), min(255, int(158 * shade)), min(255, int(11 * shade)), 255))
            else:
                pixels.append((0, 0, 0, 0))
    return create_png(w, h, pixels)

# 2. Rương Bạc Bright Silver Chest (#CBD5E1 + Cyan Gem Lock)
def gen_silver():
    w, h = 32, 32
    pixels = []
    for y in range(h):
        for x in range(w):
            if 1 <= x <= 30 and 2 <= y <= 29:
                if x in (1, 30) or y in (2, 29):
                    pixels.append((71, 85, 105, 255))
                elif 11 <= y <= 13:
                    pixels.append((51, 65, 85, 255))
                elif 12 <= x <= 19 and 14 <= y <= 21:
                    pixels.append((56, 189, 248, 255)) # Brilliant Cyan Gem Lock
                elif (6 <= x <= 8 or 23 <= x <= 25) and not (11 <= y <= 13):
                    pixels.append((148, 163, 184, 255))
                else:
                    shade = 0.82 if y > 13 else 1.15
                    pixels.append((min(255, int(203 * shade)), min(255, int(213 * shade)), min(255, int(225 * shade)), 255))
            else:
                pixels.append((0, 0, 0, 0))
    return create_png(w, h, pixels)

b64_c1 = base64.b64encode(gen_bronze()).decode('ascii')
b64_c2 = base64.b64encode(gen_silver()).decode('ascii')

target_file = 'd:/Downloads/KV lam viec/LearningJourney/Minigame/garena-skill-snake/snake.html'
html = open(target_file, 'r', encoding='utf-8').read()

# Replace chest_lvl1 and chest_lvl2 inside ASSET_B64
html = re.sub(r"chest_lvl1:\s*'data:image/png;base64,[^']+'", f"chest_lvl1: 'data:image/png;base64,{b64_c1}'", html)
html = re.sub(r"chest_lvl2:\s*'data:image/png;base64,[^']+'", f"chest_lvl2: 'data:image/png;base64,{b64_c2}'", html)

open(target_file, 'w', encoding='utf-8').write(html)
print("Updated snake.html with brilliant Bronze and Silver Chest PNGs!")
