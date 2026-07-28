import base64
import io
import re
from PIL import Image

html = open('d:/Downloads/KV lam viec/LearningJourney/Minigame/garena-skill-snake/snake.source', 'r', encoding='utf-8').read()

c1_match = re.search(r"chest_lvl1:\s*'data:image/png;base64,([^']+)'", html)
c2_match = re.search(r"chest_lvl2:\s*'data:image/png;base64,([^']+)'", html)
head_match = re.search(r"head:\s*'data:image/png;base64,([^']+)'", html)

print("head match:", bool(head_match))
print("c1 match:", bool(c1_match))
print("c2 match:", bool(c2_match))

if head_match:
    img_h = Image.open(io.BytesIO(base64.b64decode(head_match.group(1))))
    print("head size:", img_h.size, img_h.mode)

if c1_match:
    img_1 = Image.open(io.BytesIO(base64.b64decode(c1_match.group(1))))
    print("c1 size:", img_1.size, img_1.mode)
    print("c1 non-zero alpha count:", sum(1 for p in img_1.getdata() if p[3] > 0))

if c2_match:
    img_2 = Image.open(io.BytesIO(base64.b64decode(c2_match.group(1))))
    print("c2 size:", img_2.size, img_2.mode)
    print("c2 non-zero alpha count:", sum(1 for p in img_2.getdata() if p[3] > 0))
