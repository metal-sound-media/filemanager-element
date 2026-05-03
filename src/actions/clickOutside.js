// Detects clicks outside `node` and dispatches a custom event on it.
// The capture phase (third arg = true) intercepts the click before it reaches the node,
// making containment checks reliable even when inner handlers call stopPropagation.
export function clickOutside(node, eventName = 'outclick') {
  const handleClick = (event) => {
    if (!node.contains(event.target)) {
      node.dispatchEvent(new CustomEvent(eventName, { bubbles: eventName !== 'outclick' }))
    }
  }
  document.addEventListener('click', handleClick, true)
  return () => document.removeEventListener('click', handleClick, true)
}
