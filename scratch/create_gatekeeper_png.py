import math
from PIL import Image, ImageDraw, ImageFont

# Create a 512x512 PNG image for Alliance Gatekeeper avatar
width, height = 512, 512
img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Center and radius
cx, cy = 256, 256
r_bg = 240

# Outer glowing circle background
for r in range(r_bg, 0, -1):
    alpha = int(255 * (1 - (r / r_bg) ** 0.5))
    # Gradient from cyan (6,182,212) to dark purple (15,23,42)
    t = r / r_bg
    red = int(15 * t + 6 * (1 - t))
    green = int(23 * t + 182 * (1 - t))
    blue = int(42 * t + 212 * (1 - t))
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(red, green, blue, 255))

# Draw a glowing shield outline
shield_poly = [
    (256, 80),   # Top center
    (410, 130),  # Top right
    (410, 290),  # Mid right
    (256, 440),  # Bottom tip
    (102, 290),  # Mid left
    (102, 130),  # Top left
]

# Inner shield overlay
draw.polygon(shield_poly, fill=(30, 41, 59, 230), outline=(56, 189, 248, 255), width=8)

# Draw central snowflake / frost star emblem inside shield
num_points = 6
for i in range(num_points):
    angle = i * (2 * math.pi / num_points)
    x_end = cx + int(110 * math.cos(angle))
    y_end = cy + int(110 * math.sin(angle))
    draw.line([cx, cy, x_end, y_end], fill=(56, 189, 248, 255), width=6)
    
    # Add side branches
    for branch_pos in [0.4, 0.7]:
        bx = cx + int(110 * branch_pos * math.cos(angle))
        by = cy + int(110 * branch_pos * math.sin(angle))
        b_angle1 = angle + math.pi / 4
        b_angle2 = angle - math.pi / 4
        bx1 = bx + int(25 * math.cos(b_angle1))
        by1 = by + int(25 * math.sin(b_angle1))
        bx2 = bx + int(25 * math.cos(b_angle2))
        by2 = by + int(25 * math.sin(b_angle2))
        draw.line([bx, by, bx1, by1], fill=(56, 189, 248, 255), width=4)
        draw.line([bx, by, bx2, by2], fill=(56, 189, 248, 255), width=4)

# Center core orb
draw.ellipse([cx - 24, cy - 24, cx + 24, cy + 24], fill=(14, 165, 233, 255), outline=(255, 255, 255, 255), width=3)

# Save PNG
img.save("c:/Users/Brian/.gemini/antigravity/scratch/wos-public-website/public/gatekeeper.png", "PNG")
print("[SUCCESS] Saved public/gatekeeper.png (512x512 PNG)")
