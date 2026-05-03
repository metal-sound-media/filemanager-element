// Two-pass O(n) tree builder: first index all folders by ID into a Map, then
// attach each folder to its parent's children array. Avoids O(n²) repeated scans.
export function nestFolder(originalFolders) {
  const folders = originalFolders.map(folder => ({ ...folder, children: [] }))
  const foldersById = folders.reduce((acc, folder) => acc.set(folder.id, folder), new Map())
  for (const folder of folders) {
    const parent = foldersById.get(folder.parent)
    if (folder.parent && parent) {
      parent.children = parent.children ? [...parent.children, folder] : [folder]
    }
  }
  return folders
}

// Reconstruct the full ancestor chain by walking parent references through the query cache.
// No dedicated path API is needed — folder data is already in memory from prior fetches.
export function buildFolderPath(folder, queryClient) {
  if (!folder) return [null]
  // Collect every known folder from all cached 'folders/*' queries into a single lookup.
  const byId = new Map()
  for (const [key, query] of queryClient.queries) {
    if (!key.startsWith('folders/')) continue
    const data = query.getData()
    if (data) data.forEach(f => byId.set(String(f.id), f))
  }
  const path = []
  let current = byId.get(String(folder.id)) || folder
  while (current) {
    path.unshift(current)
    if (!current.parent) break
    current = byId.get(String(current.parent)) || null
  }
  return [null, ...path]
}
