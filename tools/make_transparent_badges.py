import os
from PIL import Image

badges_dir = r"c:\Users\Brian\.gemini\antigravity\scratch\wos-public-website\public\badges"

for i in range(1, 11):
    jpg_path = os.path.join(badges_dir, f"fc{i}.jpg")
    png_path = os.path.join(badges_dir, f"fc{i}.png")
    
    if not os.path.exists(jpg_path):
        print(f"Skipping fc{i}.jpg (not found)")
        continue
        
    img = Image.open(jpg_path).convert("RGBA")
    datas = img.getdata()
    
    newData = []
    for item in datas:
        r, g, b, a = item
        # Max RGB value determines alpha intensity for smooth glow blending
        max_c = max(r, g, b)
        
        # Threshold dark background noise
        if max_c < 12:
            alpha = 0
        elif max_c < 30:
            # Smooth fade in dark threshold
            alpha = int((max_c - 12) / 18 * max_c)
        else:
            alpha = 255
            
        newData.append((r, g, b, alpha))
        
    img.putdata(newData)
    img.save(png_path, "PNG")
    print(f"Successfully converted fc{i}.jpg -> fc{i}.png with transparent background")

print("All 10 badges converted to PNG with true transparency!")
