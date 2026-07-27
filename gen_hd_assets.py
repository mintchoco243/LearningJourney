import zlib
import struct
import math
import base64

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

# 1. HD Head (40x40) - Cute Garena Red Snake Head
def gen_head():
    w, h = 40, 40
    cx, cy = 20, 20
    r_outer = 18
    pixels = []
    for y in range(h):
        for x in range(w):
            dx = x - cx + 0.5
            dy = y - cy + 0.5
            dist = math.sqrt(dx*dx + dy*dy)
            
            if dist <= r_outer:
                alpha = 255 if dist <= r_outer - 1 else int(255 * (r_outer - dist))
                
                # Big Cute Eyes
                d_eye_l = math.sqrt((x - 14)**2 + (y - 14)**2)
                d_eye_r = math.sqrt((x - 26)**2 + (y - 14)**2)
                
                if d_eye_l <= 4.0 or d_eye_r <= 4.0:
                    if d_eye_l <= 2.2 or d_eye_r <= 2.2:
                        pixels.append((20, 20, 35, alpha)) # Pupil
                    else:
                        pixels.append((255, 255, 255, alpha)) # White
                else:
                    factor = 1.0 - (dist / r_outer) * 0.35
                    red = min(255, int(228 * factor + 27))
                    green = int(30 * factor)
                    blue = int(38 * factor)
                    pixels.append((red, green, blue, alpha))
            elif dist <= r_outer + 2:
                glow_alpha = int(140 * (1.0 - (dist - r_outer) / 2.0))
                pixels.append((228, 30, 38, glow_alpha))
            else:
                pixels.append((0, 0, 0, 0))
    return create_png(w, h, pixels)

# 2. HD Chest (Full-fill 32x32 without empty borders)
def gen_chest_full(main_rgb, border_rgb, lock_rgb):
    w, h = 32, 32
    pixels = []
    for y in range(h):
        for x in range(w):
            # Box bounds: x from 1 to 30, y from 3 to 29 (Full Fill!)
            if 1 <= x <= 30 and 3 <= y <= 29:
                # Border
                if x == 1 or x == 30 or y == 3 or y == 29:
                    pixels.append((border_rgb[0], border_rgb[1], border_rgb[2], 255))
                # Chest Lid Separator Bar Line at y = 12, 13
                elif 12 <= y <= 13:
                    pixels.append((border_rgb[0], border_rgb[1], border_rgb[2], 255))
                # Shiny Lock at Center (x: 13..18, y: 15..20)
                elif 13 <= x <= 18 and 15 <= y <= 20:
                    pixels.append((lock_rgb[0], lock_rgb[1], lock_rgb[2], 255))
                # Vertical Metallic Straps (x: 6..7 and x: 24..25)
                elif (6 <= x <= 7 or 24 <= x <= 25) and not (12 <= y <= 13):
                    pixels.append((border_rgb[0], border_rgb[1], border_rgb[2], 255))
                else:
                    # Body shading
                    shade = 0.85 if y > 13 else 1.05
                    r = min(255, int(main_rgb[0] * shade))
                    g = min(255, int(main_rgb[1] * shade))
                    b = min(255, int(main_rgb[2] * shade))
                    pixels.append((r, g, b, 255))
            else:
                pixels.append((0, 0, 0, 0))
    return create_png(w, h, pixels)

head_png = gen_head()
# Level 1: Rương Đồng / Vàng Rực Rỡ (#F59E0B)
c1_png = gen_chest_full((245, 158, 11), (180, 83, 9), (254, 240, 138))
# Level 2: Rương Bạc Bright Silver (#E2E8F0)
c2_png = gen_chest_full((226, 232, 240), (100, 116, 139), (255, 255, 255))

b64_head = base64.b64encode(head_png).decode('ascii')
b64_c1 = base64.b64encode(c1_png).decode('ascii')
b64_c2 = base64.b64encode(c2_png).decode('ascii')

print("b64_head:", b64_head[:30])
print("b64_c1:", b64_c1[:30])
print("b64_c2:", b64_c2[:30])

with open("d:/Downloads/KV lam viec/LearningJourney/hd_assets.py", "w") as f:
    f.write(f'HEAD = "{b64_head}"\nC1 = "{b64_c1}"\nC2 = "{b64_c2}"\n')
