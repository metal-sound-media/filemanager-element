import { createAlert } from './Alert.js'
import { renderList } from '../../state/list.js'

// Subscribes to ctx.flashMessages and keeps the alerts wrapper in sync via renderList,
// keyed by message ID so new messages are appended without rebuilding existing ones.
export function createAlerts(container, ctx) {
  const wrapper = document.createElement('div')
  wrapper.classList.add('fm-alerts-wrapper')
  container.appendChild(wrapper)

  const itemMap = new Map()

  const unsub = ctx.flashMessages.subscribe(messages => {
    renderList(wrapper, messages, m => m.id, m => createAlert(m, ctx), itemMap)
  })

  return () => {
    unsub()
    for (const entry of itemMap.values()) entry.destroy()
    wrapper.remove()
  }
}
