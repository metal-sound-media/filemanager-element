export function tooltip(node, title) {
  let tip = null
  const onEnter = () => {
    if (tip) return
    const rect = node.getBoundingClientRect()
    tip = document.createElement('div')
    tip.classList.add('fm-tooltip')
    tip.innerText = title
    // Append to the nearest .fm-root ancestor so the tooltip escapes any
    // overflow:hidden parents and renders above all other component content.
    const root = node.closest('.fm-root')
    root.appendChild(tip)
    // Center horizontally above the node, offset upward by 4 px + the tooltip height.
    tip.style.setProperty(
      'transform',
      `translate(calc(${rect.left + rect.width / 2}px - 50%), calc(${rect.top - 4}px - 100%))`
    )
    tip.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-in-out' })
    // Wait for the 200 ms fade-out animation to finish before removing the element.
    node.addEventListener('pointerleave', () => {
      if (tip) {
        tip.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in-out' })
        window.setTimeout(() => { tip?.remove(); tip = null }, 200)
      }
    }, { once: true })
  }
  node.addEventListener('pointerenter', onEnter)
  return () => {
    tip?.remove()
    node.removeEventListener('pointerenter', onEnter)
  }
}
