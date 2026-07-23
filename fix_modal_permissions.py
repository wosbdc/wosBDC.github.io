with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """        const [liveSnap, metaSnap, histSnap] = await Promise.all([
           get(ref(db, 'showdown_live')),
           get(ref(db, 'showdown_meta')),
           get(ref(db, 'showdown_history'))
        ]);"""

replacement = """        const [liveSnap, metaSnap, histSnap] = await Promise.all([
           get(ref(db, 'showdown_live')).catch(e => { console.warn("showdown_live read error", e); return { exists: () => false, val: () => ({}) }; }),
           get(ref(db, 'showdown_meta')).catch(e => { console.warn("showdown_meta read error", e); return { exists: () => false, val: () => ({}) }; }),
           get(ref(db, 'showdown_history')).catch(e => { console.warn("showdown_history read error", e); return { exists: () => false, val: () => null }; })
        ]);"""

if target in content:
    content = content.replace(target, replacement)
    with open('main.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed modal permission handling")
else:
    print("Target not found")
