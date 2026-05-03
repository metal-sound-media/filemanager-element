import { fetchApi } from './functions/api.js'

// Default REST API implementation used when no custom handlers are provided.
// Consumers can override individual methods (or all of them) when calling
// FileManager.register() or constructing the element with options.
// httpHeaders is merged into every request — useful for auth tokens or CSRF headers.
const config = {
  endpoint: '',
  readOnly: false,
  httpHeaders: {},

  getFolders(parent) {
    return fetchApi(this.endpoint, '/folders', {
      query: { parent: parent?.id?.toString() },
      headers: this.httpHeaders,
    })
  },

  createFolder(params) {
    return fetchApi(this.endpoint, '/folders', {
      method: 'post',
      headers: this.httpHeaders,
      json: params,
    })
  },

  deleteFolder(folder) {
    return fetchApi(this.endpoint, '/folders/{id}', {
      method: 'delete',
      headers: this.httpHeaders,
      params: { id: folder.id.toString() },
    })
  },

  renameFolder(folder, name) {
    return fetchApi(this.endpoint, '/folders/{id}', {
      method: 'patch',
      headers: this.httpHeaders,
      params: { id: folder.id.toString() },
      json: { name },
    })
  },

  getFiles(folder) {
    return fetchApi(this.endpoint, '/files', {
      headers: this.httpHeaders,
      query: { folder: folder?.id ? folder.id.toString() : undefined },
    })
  },

  uploadFile(file, folder) {
    const form = new FormData()
    form.set('file', file)
    if (folder?.id) form.set('folder', folder.id.toString())
    return fetchApi(this.endpoint, '/files', {
      method: 'post',
      headers: this.httpHeaders,
      body: form,
    })
  },

  deleteFile(file) {
    return fetchApi(this.endpoint, '/files/{id}', {
      method: 'delete',
      headers: this.httpHeaders,
      params: { id: file.id.toString() },
    })
  },
}

export default config
