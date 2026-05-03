import { $on } from '../functions/dom.js'

// Intercepts all drag events on `node` and translates them into two semantic
// custom events that consumers can listen to without touching raw drag APIs.
// All drag events are preventDefault()ed — required by browsers to allow dropping.
export function dragOver(node) {
  const offPrevent = $on(node, ['drag','dragstart','dragend','dragover','dragenter','dragleave','drop'], e => {
    e.preventDefault()
    e.stopPropagation()
  })
  const offOver = $on(node, ['dragover', 'dragenter'], () => {
    node.dispatchEvent(new CustomEvent('dropzoneover'))
  })
  const offLeave = $on(node, ['dragleave', 'dragend', 'drop'], () => {
    node.dispatchEvent(new CustomEvent('dropzoneleave'))
  })
  return () => {
    offPrevent()
    offOver()
    offLeave()
  }
}
