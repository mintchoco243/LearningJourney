import base64
import os

base = 'd:/Downloads/KV lam viec/LearningJourney/Minigame/garena-skill-snake/assets'
head = base64.b64encode(open(os.path.join(base, 'head.png'), 'rb').read()).decode('ascii')
c1 = base64.b64encode(open(os.path.join(base, 'chest_lvl1.png'), 'rb').read()).decode('ascii')
c2 = base64.b64encode(open(os.path.join(base, 'chest_lvl2.png'), 'rb').read()).decode('ascii')

js_code = f"""
    const ASSET_B64 = {{
      head: 'data:image/png;base64,{head}',
      chest_lvl1: 'data:image/png;base64,{c1}',
      chest_lvl2: 'data:image/png;base64,{c2}'
    }};
"""

with open('d:/Downloads/KV lam viec/LearningJourney/b64_assets.js', 'w') as f:
    f.write(js_code)

print("b64_assets.js generated successfully!")
