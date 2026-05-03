import { FileManager } from './FileManager.js'
import { filesResponse, foldersResponse } from '../tests/mockApi.ts'

FileManager.register()
FileManager.register('fn-file-manager', {
  getFiles(folder) {
    if (folder?.name === 'Empty') return Promise.resolve([])
    return Promise.resolve(filesResponse(15, folder?.id))
  },
  getFolders(parent) {
    return Promise.resolve(foldersResponse(10, parent?.id))
  },
  createFolder(params) {
    return Promise.resolve({ id: `Folder${Date.now()}`, name: params.name, parent: params.parent })
  },
  deleteFile() { return Promise.resolve() },
  deleteFolder() { return Promise.resolve() },
  renameFolder(folder, name) {
    return Promise.resolve({ id: folder.id, name, parent: folder.parent })
  },
  uploadFile(file, folder) {
    const url = `https://picsum.photos`
    return Promise.resolve({
      id: folder?.name || '',
      name: `new_file.png`,
      url: url + '/1024/768',
      size: Math.random() * 100,
      folder: 1,
      thumbnail: url + '/100/100',
    })
  },
})

const apiBasedManager = document.querySelector('file-manager')
const fnBasedManager = document.querySelector('fn-file-manager')
;[apiBasedManager, fnBasedManager].forEach(el =>
  el.addEventListener('close', e => e.currentTarget.setAttribute('hidden', ''))
)

;[apiBasedManager, fnBasedManager].forEach(el =>
  el.addEventListener('selectfile', e => {
    alert(e.detail.url)
    console.log(e.detail)
  })
)

document.querySelector('#api').addEventListener('click', () => apiBasedManager.removeAttribute('hidden'))
document.querySelector('#function').addEventListener('click', () => fnBasedManager.removeAttribute('hidden'))

if (window.location.hash === '#function') {
  fnBasedManager.removeAttribute('hidden')
} else if (window.location.hash === '#readonly') {
  document.querySelector('[readonly]').removeAttribute('hidden')
} else {
  apiBasedManager.removeAttribute('hidden')
}
