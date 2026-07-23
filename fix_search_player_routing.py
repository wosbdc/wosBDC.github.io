with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_search_start = """window.searchPlayerFull = async (name) => {
  let targetName = name ? name.replace(/^✅\\s*/, '').trim() : '';
  window.activeViewFunc = () => window.searchPlayerFull(name);
  const resDiv = document.getElementById('uniEditorRes');
  if (!name || !name.trim()) {
    resDiv.style.display = 'none';
    return;
  }"""

new_search_start = """window.searchPlayerFull = async (name) => {
  let targetName = name ? name.replace(/^✅\\s*/, '').trim() : '';
  window.activeViewFunc = () => window.searchPlayerFull(name);
  
  let resDiv = document.getElementById('uniEditorRes');
  if (!resDiv) {
    if (views.playerEditor) await views.playerEditor();
    resDiv = document.getElementById('uniEditorRes');
    const searchInput = document.getElementById('uniSearchInput');
    if (searchInput) searchInput.value = targetName;
  }

  if (!resDiv) return;
  if (!targetName) {
    resDiv.style.display = 'none';
    return;
  }"""

if old_search_start in content:
    content = content.replace(old_search_start, new_search_start)
    with open('main.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully fixed searchPlayerFull DOM container auto-routing")
else:
    print("old_search_start target not found")
