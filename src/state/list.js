/**
 * Keyed list renderer replacing Svelte {#each} blocks.
 * Maintains a Map of key→{element, destroy} to efficiently add/remove/reorder items.
 *
 * @param {HTMLElement} container
 * @param {any[]} items
 * @param {(item: any) => string|number} getKey
 * @param {(item: any) => {element: HTMLElement, destroy: () => void}} createItem
 * @param {Map} existingMap
 * @returns {Map}
 */
export function renderList(container, items, getKey, createItem, existingMap) {
  const newKeys = new Set(items.map(getKey))

  for (const [key, entry] of existingMap) {
    if (!newKeys.has(key)) {
      entry.destroy()
      entry.element.remove()
      existingMap.delete(key)
    }
  }

  items.forEach((item, i) => {
    const key = getKey(item)
    if (!existingMap.has(key)) {
      existingMap.set(key, createItem(item))
    } else {
      existingMap.get(key).update?.(item)
    }
    const entry = existingMap.get(key)
    // insertBefore(el, null) appends when the item belongs at the end,
    // preserving the exact order of the items array in the DOM.
    if (container.children[i] !== entry.element) {
      container.insertBefore(entry.element, container.children[i] ?? null)
    }
  })

  return existingMap
}
