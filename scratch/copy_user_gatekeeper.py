import shutil

src = r"C:\Users\Brian\.gemini\antigravity\brain\c45366e8-cbb9-41d2-bffa-304d60a9be03\.user_uploaded\media_1786639164096.png"
dst = r"c:\Users\Brian\.gemini\antigravity\scratch\wos-public-website\public\gatekeeper.png"

shutil.copyfile(src, dst)
print("[SUCCESS] Copied user's Gatekeeper image to public/gatekeeper.png")
