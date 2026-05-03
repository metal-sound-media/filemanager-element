function svgFromString(html) {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.firstElementChild
}

export function iconFolder(className) {
  return svgFromString(`<svg width="23" height="23" fill="none" xmlns="http://www.w3.org/2000/svg" class="${className ?? ''}">
    <path d="M22.7 10.578c-.289-.29-.72-.578-1.152-.578H5.715c-.575 0-1.151.289-1.295.867L.102 20.977C-.186 21.845.102 23 1.397 23H17.23c.575 0 1.151-.289 1.295-.867l4.318-10.11c.288-.434.144-1.012-.144-1.445z" fill="currentColor"/>
    <path d="M1.754 9.814c.73-1.587 2.338-2.598 4.092-2.598H19V4.33c0-.866-.585-1.443-1.462-1.443H9.354L6.869.433C6.577.144 6.285 0 5.846 0H1.462C.585 0 0 .577 0 1.443V14l1.754-4.186z" fill="currentColor"/>
  </svg>`)
}

export function iconLoader(size = 20, className) {
  const div = document.createElement('div')
  div.classList.add('fm-loader')
  if (className) div.classList.add(className)
  div.style.setProperty('--size', `${size}px`)
  return div
}

export function iconArrowRight(size = 16) {
  return svgFromString(`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16" width="${size}" height="${size}">
    <path fill="currentColor" fill-rule="evenodd" d="M0 8a1 1 0 0 1 1-1h11.58L8.3 2.7a1 1 0 1 1 1.42-1.4l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.42-1.4L12.6 9H1a1 1 0 0 1-1-1Z" clip-rule="evenodd"/>
  </svg>`)
}

export function iconCircleCheck(size = 24) {
  return svgFromString(`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="${size}" height="${size}">
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m8 12.5 3 3 5-6"/>
    <path stroke="currentColor" stroke-width="2" d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/>
  </svg>`)
}

export function iconCircleExclamation(size = 24) {
  return svgFromString(`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="${size}" height="${size}">
    <path stroke="currentColor" stroke-width="2" d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/>
    <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M12 16.5v.5m0-10v6-6Z"/>
  </svg>`)
}

export function iconCirclePlus(size = 24) {
  return svgFromString(`<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="${size}" height="${size}" viewBox="0 0 24 24">
    <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M12 12H8m4-4v4-4Zm0 4v4-4Zm0 0h4-4Z"/>
    <path stroke="currentColor" stroke-width="2" d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/>
  </svg>`)
}

export function iconCopy(size = 16) {
  return svgFromString(`<svg fill="none" xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 16 16">
    <path d="M7 8H1c-.6 0-1 .4-1 1v6c0 .6.4 1 1 1h6c.6 0 1-.4 1-1V9c0-.6-.4-1-1-1z" fill="currentColor"/>
    <path d="M11 4H2v2h8v8h2V5c0-.6-.4-1-1-1z" fill="currentColor"/>
    <path d="M15 0H6v2h8v8h2V1c0-.6-.4-1-1-1z" fill="currentColor"/>
  </svg>`)
}

export function iconDelete() {
  return svgFromString(`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="16" height="16" fill="white"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M1 0H15C15.6 0 16 0.4 16 1V15C16 15.6 15.6 16 15 16H1C0.4 16 0 15.6 0 15V1C0 0.4 0.4 0 1 0ZM10.1 11.5L11.5 10.1L9.4 8L11.5 5.9L10.1 4.5L8 6.6L5.9 4.5L4.5 5.9L6.6 8L4.5 10.1L5.9 11.5L8 9.4L10.1 11.5Z" fill="currentColor"/>
  </svg>`)
}

export function iconNewFolder(size = 24) {
  return svgFromString(`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="${size}" height="${size}">
    <path fill="currentColor" d="M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Zm0 12H4V6h5.17l2 2H20v10Zm-8-4h2v2h2v-2h2v-2h-2v-2h-2v2h-2v2Z"/>
  </svg>`)
}

export function iconSearch() {
  return svgFromString(`<svg width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 6.417a6.424 6.424 0 006.417 6.416 6.424 6.424 0 006.416-6.416A6.424 6.424 0 006.417 0 6.424 6.424 0 000 6.417zm1.833 0a4.589 4.589 0 014.584-4.584A4.589 4.589 0 0111 6.417 4.589 4.589 0 016.417 11a4.589 4.589 0 01-4.584-4.583z" fill="currentColor"/>
    <path d="M13.75 12.543L11.707 10.5c-.35.452-.755.856-1.207 1.207l2.043 2.043a.851.851 0 001.207 0 .853.853 0 000-1.207z" fill="currentColor"/>
  </svg>`)
}

export function iconUpload(animated = false) {
  const svg = svgFromString(`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.12 21.1765L3.83997 21.1765L3.83997 19.7647C3.83997 18.985 3.19526 18.3529 2.39997 18.3529C1.60468 18.3529 0.959966 18.985 0.959966 19.7647L0.959966 22.5882C0.959966 22.9781 1.12114 23.331 1.38173 23.5865C1.64232 23.842 2.00232 24 2.39997 24L22.56 24C22.7541 24 22.9393 23.9623 23.1084 23.894C23.6317 23.6826 24 23.1776 24 22.5882L24 19.7647C24 18.985 23.3553 18.3529 22.56 18.3529C21.7647 18.3529 21.12 18.985 21.12 19.7647L21.12 21.1765Z" fill="currentColor"/>
    <path d="M18.884 10.0314C18.6841 9.93335 18.4636 9.88232 18.2401 9.88232C17.9285 9.88232 17.6253 9.9814 17.3761 10.1647L13.92 12.7159C13.92 12.7125 13.92 12.7092 13.92 12.7059L13.92 1.41176C13.92 1.03734 13.7683 0.67825 13.4983 0.413493C13.2282 0.148736 12.862 -2.98024e-06 12.48 -3.01363e-06C12.0981 -3.04702e-06 11.7319 0.148736 11.4618 0.413493C11.1918 0.67825 11.04 1.03734 11.04 1.41176L11.04 12.7059C11.04 12.7325 11.0408 12.7591 11.0423 12.7855L7.55526 10.3764C7.40048 10.2681 7.22535 10.1909 7.03998 10.1493C6.85461 10.1077 6.66267 10.1025 6.47523 10.134C6.2878 10.1655 6.10858 10.233 5.94794 10.3328C5.78729 10.4326 5.64839 10.5626 5.53926 10.7153C5.32063 11.0207 5.23426 11.3986 5.29902 11.7664C5.36378 12.1341 5.57441 12.4617 5.88485 12.6776L11.6449 16.6588C11.8915 16.8355 12.189 16.9307 12.4945 16.9307C12.7999 16.9307 13.0974 16.8355 13.3441 16.6588L19.1041 12.4235C19.2553 12.3123 19.3828 12.1729 19.4791 12.0134C19.5755 11.8538 19.6388 11.6773 19.6656 11.4937C19.6923 11.3102 19.6819 11.1233 19.635 10.9437C19.5881 10.7641 19.5055 10.5953 19.3921 10.447C19.2579 10.2717 19.084 10.1294 18.884 10.0314Z" fill="currentColor" class="${animated ? 'fm-upload-animated' : ''}"/>
  </svg>`)
  return svg
}

export function iconHome(size = 16) {
  return svgFromString(`<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="${size}" height="${size}">
    <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
  </svg>`)
}

export function iconButton(children, disabled = false) {
  const btn = document.createElement('button')
  btn.classList.add('fm-icon-button')
  btn.disabled = disabled
  if (children) btn.appendChild(children)
  return btn
}
