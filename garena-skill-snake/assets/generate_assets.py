import zlib
import struct
import math

def create_png(width, height, pixels):
    """
    pixels: list of (r, g, b, a) tuples of length width * height
    """
    def make_chunk(chunk_type, data):
        return struct.pack('>I', len(data)) + chunk_type + data + struct.pack('>I', zlib.crc32(chunk_type + data) & 0xffffffff)

    header = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_chunk = make_chunk(b'IHDR', ihdr)

    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # Filter type 0 (None)
        for x in range(width):
            r, g, b, a = pixels[y * width + x]
            raw_data.extend([r, g, b, a])

    idat_chunk = make_chunk(b'IDAT', zlib.compress(bytes(raw_data)))
    iend_chunk = make_chunk(b'IEND', b'')

    return header + ihdr_chunk + idat_chunk + iend_chunk

# 1. Generate head.png (40x40px glowing red circle snake head in Garena Red #E41E26)
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
                # Anti-aliasing / edge blending
                alpha = 255 if dist <= r_outer - 1 else int(255 * (r_outer - dist))
                
                # Check eyes
                d_eye_l = math.sqrt((x - 14)**2 + (y - 14)**2)
                d_eye_r = math.sqrt((x - 26)**2 + (y - 14)**2)
                
                if d_eye_l <= 3.5 or d_eye_r <= 3.5:
                    if d_eye_l <= 2.0 or d_eye_r <= 2.0:
                        # Dark Pupil
                        pixels.append((20, 20, 30, alpha))
                    else:
                        pixels.append((255, 255, 255, alpha))
                else:
                    # Garena Red #E41E26 (228, 30, 38)
                    factor = 1.0 - (dist / r_outer) * 0.4
                    red = min(255, int(228 * factor + 27))
                    green = int(30 * factor)
                    blue = int(38 * factor)
                    pixels.append((red, green, blue, alpha))
            elif dist <= r_outer + 2:
                # Glow effect #E41E26
                glow_alpha = int(140 * (1.0 - (dist - r_outer) / 2.0))
                pixels.append((228, 30, 38, glow_alpha))
            else:
                pixels.append((0, 0, 0, 0))
    return create_png(w, h, pixels)

# Helper to create chest icon
def gen_chest(main_color, border_color, accent_color):
    w, h = 32, 32
    pixels = []
    for y in range(h):
        for x in range(w):
            # Check chest boundaries: box from x:4 to 27, y:6 to 26
            if 4 <= x <= 27 and 6 <= y <= 26:
                # Outer border
                if x == 4 or x == 27 or y == 6 or y == 26:
                    pixels.append((border_color[0], border_color[1], border_color[2], 255))
                # Chest Lid Line at y = 13
                elif y == 13:
                    pixels.append((border_color[0], border_color[1], border_color[2], 255))
                # Lock/Keyhole in center (x: 14 to 17, y: 15 to 18)
                elif 14 <= x <= 17 and 15 <= y <= 18:
                    pixels.append((accent_color[0], accent_color[1], accent_color[2], 255))
                # Vertical straps at x = 9, 10 and x = 21, 22
                elif (9 <= x <= 10 or 21 <= x <= 22) and y != 13:
                    pixels.append((border_color[0], border_color[1], border_color[2], 255))
                else:
                    # Main chest body shading
                    shade = 0.85 if y > 13 else 1.0
                    r = int(main_color[0] * shade)
                    g = int(main_color[1] * shade)
                    b = int(main_color[2] * shade)
                    pixels.append((r, g, b, 255))
            elif 3 <= x <= 28 and 5 <= y <= 27:
                # Subtle glow shadow
                pixels.append((main_color[0], main_color[1], main_color[2], 80))
            else:
                pixels.append((0, 0, 0, 0))
    return create_png(w, h, pixels)

# Save images
with open("head.png", "wb") as f:
    f.write(gen_head())

# Level 1: Rương Đồng (Metallic Bronze Gold - #D97706)
with open("chest_lvl1.png", "wb") as f:
    f.write(gen_chest((217, 119, 6), (146, 64, 14), (254, 240, 138)))

# Level 2: Rương Bạc (Metallic Silver - #CBD5E1)
with open("chest_lvl2.png", "wb") as f:
    f.write(gen_chest((203, 213, 225), (71, 85, 105), (255, 255, 255)))

print("Assets re-generated successfully: Chest Bronze (Gold) & Chest Silver!")
