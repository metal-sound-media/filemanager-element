import { createContext } from './state/context.js'
import { setLang } from './lang.js'
import { createSidebar } from './ui/Sidebar/Sidebar.js'
import { createDropzone } from './ui/Dropzone.js'
import { createBreadcrumb } from './ui/Breadcrumb.js'
import { createFilesList } from './ui/FilesList.js'
import { createAlerts } from './ui/Alerts/Alerts.js'
import { createUploadProgress } from './ui/Progress/UploadProgress.js'
import { clickOutside } from './actions/clickOutside.js'
import config from './config.js'
import './styles/filemanager.css'

// Builds the full component DOM tree and wires up all UI sub-components.
// Returns { setHidden, destroy } so the element can mount/unmount on demand
// without being recreated — subscriptions and DOM are only allocated while visible.
function createFileManagerUI(hostElement, { layout, lazyFolders }, ctx) {
  let root = null
  let cleanupUI = null

  function mount() {
    if (root) return

    root = document.createElement('div')
    root.classList.add('fm-root')
    document.body.appendChild(root)

    const overlay = document.createElement('div')
    overlay.classList.add('fm-overlay')
    root.appendChild(overlay)

    const modal = document.createElement('div')
    modal.classList.add('fm-modal')
    overlay.appendChild(modal)

    const destroySidebar = createSidebar(modal, lazyFolders, ctx)
    const mainEl = createDropzone(modal, ctx)

    const destroyBreadcrumb = createBreadcrumb(mainEl, ctx)

    const contentEl = document.createElement('div')
    contentEl.classList.add('fm-main-content')
    mainEl.appendChild(contentEl)

    let destroyFilesList = null
    // Recreate the files list every time the active folder changes so the
    // new folder's queries and subscriptions start fresh.
    const unsubFolder = ctx.folder.subscribe(folder => {
      if (destroyFilesList) destroyFilesList()
      destroyFilesList = createFilesList(contentEl, folder, layout, ctx)
    })

    const destroyAlerts = createAlerts(modal, ctx)
    const destroyProgress = createUploadProgress(modal, ctx)

    const cleanupClickOutside = clickOutside(modal, 'close')
    modal.addEventListener('close', () => {
      hostElement.dispatchEvent(new CustomEvent('close', { bubbles: true }))
    })
    root.addEventListener('selectfile', e => {
      hostElement.dispatchEvent(new CustomEvent('selectfile', { detail: e.detail, bubbles: true }))
    })

    // Unsubscribe from stores first so no callbacks fire on already-removed nodes,
    // then tear down child components in dependency order.
    cleanupUI = () => {
      unsubFolder()
      if (destroyFilesList) destroyFilesList()
      destroySidebar()
      destroyBreadcrumb()
      destroyAlerts()
      destroyProgress()
      cleanupClickOutside()
      root.remove()
      root = null
      cleanupUI = null
    }
  }

  function unmount() {
    if (cleanupUI) cleanupUI()
  }

  return {
    setHidden(val) {
      if (val) unmount()
      else mount()
    },
    destroy() { unmount() },
  }
}

export class FileManager {
  static registered = new Map()

  constructor(element, options = {}) {
    this.element = element
    this.options = { ...config, ...options }
    this.ui = null
  }

  static get observedAttributes() {
    return ['hidden', 'endpoint']
  }

  connectedCallback() {
    this.element.style.setProperty('display', 'block')
    const endpointAttr = this.element.getAttribute('endpoint')
    if (endpointAttr) this.options.endpoint = endpointAttr
    this.options.readOnly = this.element.hasAttribute('readonly')

    if (!this.options.endpoint && !this.options.getFiles) {
      throw new Error('You must define an endpoint for this custom element')
    }

    setLang(document.documentElement.getAttribute('lang') || 'en')

    const ctx = createContext(this.options)
    this.ctx = ctx
    this.ui = createFileManagerUI(this.element, {
      layout: this.element.getAttribute('layout') || 'grid',
      lazyFolders: this.element.hasAttribute('lazy-folders'),
    }, ctx)

    if (!this.element.hidden) {
      this.ui.setHidden(false)
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // Drive mount/unmount via the hidden attribute rather than CSS so that all
    // event listeners and store subscriptions are released when the panel is closed.
    if (name === 'hidden' && this.ui) {
      this.ui.setHidden(newValue !== null)
    }
    if (name === 'endpoint') {
      this.options.endpoint = newValue
    }
  }

  disconnectedCallback() {
    this.ui?.destroy()
  }

  // Registers the custom element under `name`. Each call with a different name
  // produces an independent anonymous HTMLElement subclass so multiple instances
  // with different options can coexist in the same page without namespace conflicts.
  static register(name = 'file-manager', options) {
    if (!this.registered.has(name)) {
      class AnonymousFileManager extends HTMLElement {
        constructor() {
          super()
          this._fm = new FileManager(this, options)
        }

        static get observedAttributes() {
          return FileManager.observedAttributes
        }

        connectedCallback() {
          return this._fm.connectedCallback()
        }

        attributeChangedCallback(name, oldValue, newValue) {
          return this._fm.attributeChangedCallback(name, oldValue, newValue)
        }

        disconnectedCallback() {
          return this._fm.disconnectedCallback()
        }
      }

      customElements.define(name, AnonymousFileManager)
      this.registered.set(name, true)
    }
  }
}
