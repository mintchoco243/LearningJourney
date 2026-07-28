import base64
import io
import re
from PIL import Image, ImageDraw

def build_valid_chests():
    # 1. Rương Đồng / Gold Chest (#F59E0B)
    img1 = Image.new('RGBA', (40, 40), (0, 0, 0, 0))
    draw1 = ImageDraw.Draw(img1)
    # Chest Box Body (x: 2..37, y: 4..35)
    draw1.rounded_rectangle([2, 4, 37, 35], radius=6, fill=(245, 158, 11, 255), outline=(180, 83, 9, 255), width=2)
    # Lid Horizontal Strap Line
    draw1.line([2, 16, 37, 16], fill=(146, 64, 14, 255), width=2)
    # Metallic Vertical Straps
    draw1.rectangle([8, 4, 12, 35], fill=(180, 83, 9, 255))
    draw1.rectangle([27, 4, 31, 35], fill=(180, 83, 9, 255))
    # Shiny Gold Lock Plate at Center
    draw1.rounded_rectangle([15, 17, 24, 26], radius=3, fill=(254, 240, 138, 255), outline=(180, 83, 9, 255), width=1)
    draw1.ellipse([18, 19, 21, 22], fill=(120, 53, 15, 255))
    draw1.line([19, 21, 19, 24], fill=(120, 53, 15, 255), width=1)

    # 2. Rương Bạc / Silver Chest (#CBD5E1 + Cyan Gem Lock)
    img2 = Image.new('RGBA', (40, 40), (0, 0, 0, 0))
    draw2 = ImageDraw.Draw(img2)
    # Chest Box Body (x: 2..37, y: 4..35)
    draw2.rounded_rectangle([2, 4, 37, 35], radius=6, fill=(203, 213, 225, 255), outline=(71, 85, 105, 255), width=2)
    # Lid Horizontal Strap Line
    draw2.line([2, 16, 37, 16], fill=(51, 65, 85, 255), width=2)
    # Metallic Vertical Straps
    draw2.rectangle([8, 4, 12, 35], fill=(148, 163, 184, 255))
    draw2.rectangle([27, 4, 31, 35], fill=(148, 163, 184, 255))
    # Brilliant Cyan Gem Lock Plate at Center
    draw2.rounded_rectangle([15, 17, 24, 26], radius=3, fill=(56, 189, 248, 255), outline=(30, 58, 138, 255), width=1)
    draw2.ellipse([18, 19, 21, 22], fill=(255, 255, 255, 255))

    # Convert both to PNG Base64
    buf1 = io.BytesIO()
    img1.save(buf1, format='PNG')
    b64_1 = base64.b64encode(buf1.getvalue()).decode('ascii')

    buf2 = io.BytesIO()
    img2.save(buf2, format='PNG')
    b64_2 = base64.b64encode(buf2.getvalue()).decode('ascii')

    # Test reading back with PIL
    t1 = Image.open(io.BytesIO(base64.b64decode(b64_1)))
    t2 = Image.open(io.BytesIO(base64.b64decode(b64_2)))
    print("t1 valid:", t1.size, t1.mode)
    print("t2 valid:", t2.size, t2.mode)

    # Replace in the source game document
    target_file = 'd:/Downloads/KV lam viec/LearningJourney/Minigame/garena-skill-snake/snake.source'
    html = open(target_file, 'r', encoding='utf-8').read()

    html = re.sub(r"chest_lvl1:\s*'data:image/png;base64,[^']+'", f"chest_lvl1: 'data:image/png;base64,{b64_1}'", html)
    html = re.sub(r"chest_lvl2:\s*'data:image/png;base64,[^']+'", f"chest_lvl2: 'data:image/png;base64,{b64_2}'", html)

    open(target_file, 'w', encoding='utf-8').write(html)
    print("Updated snake.html with 100% VALID PIL-encoded PNGs!")

build_valid_chests()
