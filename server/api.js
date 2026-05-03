import fs from 'fs'
import path from 'path'

// ---------------------------------------------------------------------------
// Storage helpers — filesystem-based (real folders = real directories)
// ---------------------------------------------------------------------------
// Folder IDs are paths relative to the uploads/ directory.
// e.g. "my-folder", "my-folder/sub"
// File metadata is stored in .filemeta.json inside each folder directory.

function makeFs(storageDir) {
  const uploadsDir = path.join(storageDir, 'uploads')

  function init() {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  function absPath(relId) {
    if (!relId) return uploadsDir
    // Prevent path traversal
    const resolved = path.resolve(uploadsDir, relId)
    if (!resolved.startsWith(uploadsDir + path.sep) && resolved !== uploadsDir) {
      throw new Error('Invalid path')
    }
    return resolved
  }

  function folderToObj(relId) {
    const name = relId ? path.basename(relId) : ''
    const parentRel = relId ? path.dirname(relId) : null
    const parent = parentRel === '.' || parentRel === '' ? null : parentRel
    return { id: relId, name, parent }
  }

  function listFolders(parentId) {
    const dir = absPath(parentId)
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir)
      .filter(name => {
        if (name.startsWith('.')) return false
        return fs.statSync(path.join(dir, name)).isDirectory()
      })
      .map(name => {
        const relId = parentId ? `${parentId}/${name}` : name
        return folderToObj(relId)
      })
  }

  function createFolder(name, parentId) {
    const relId = parentId ? `${parentId}/${name}` : name
    fs.mkdirSync(absPath(relId), { recursive: true })
    return folderToObj(relId)
  }

  function renameFolder(id, newName) {
    const oldAbs = absPath(id)
    const parentRel = path.dirname(id)
    const newRelId = (parentRel === '.' || parentRel === '') ? newName : `${parentRel}/${newName}`
    const newAbs = absPath(newRelId)
    fs.renameSync(oldAbs, newAbs)
    return folderToObj(newRelId)
  }

  function deleteFolderRecursive(id) {
    const abs = absPath(id)
    if (fs.existsSync(abs)) fs.rmSync(abs, { recursive: true, force: true })
  }

  function folderExists(id) {
    const abs = absPath(id)
    return fs.existsSync(abs) && fs.statSync(abs).isDirectory()
  }

  // File metadata per folder stored in .filemeta.json
  function readMeta(folderId) {
    const dir = absPath(folderId)
    const metaFile = path.join(dir, '.filemeta.json')
    if (!fs.existsSync(metaFile)) return []
    try { return JSON.parse(fs.readFileSync(metaFile, 'utf-8')) } catch { return [] }
  }

  function writeMeta(folderId, files) {
    const dir = absPath(folderId)
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, '.filemeta.json'), JSON.stringify(files, null, 2))
  }

  return { init, absPath, uploadsDir, listFolders, createFolder, renameFolder, deleteFolderRecursive, folderExists, readMeta, writeMeta }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// ---------------------------------------------------------------------------
// Multipart parser (no external dependency)
// ---------------------------------------------------------------------------

async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function parseMultipart(buffer, boundary) {
  const parts = {}
  const sep = Buffer.from('\r\n--' + boundary)
  const first = Buffer.from('--' + boundary)

  let pos = buffer.indexOf(first)
  if (pos === -1) return parts
  pos += first.length

  while (pos < buffer.length) {
    const next2 = buffer.slice(pos, pos + 2).toString()
    if (next2 === '--') break
    if (next2 === '\r\n') pos += 2

    const headEnd = bufIndexOf(buffer, '\r\n\r\n', pos)
    if (headEnd === -1) break
    const headStr = buffer.slice(pos, headEnd).toString()
    pos = headEnd + 4

    const nextBound = bufIndexOf(buffer, sep, pos)
    if (nextBound === -1) break
    const content = buffer.slice(pos, nextBound)
    pos = nextBound + sep.length

    const headers = {}
    for (const line of headStr.split('\r\n')) {
      const col = line.indexOf(':')
      if (col !== -1) headers[line.slice(0, col).toLowerCase().trim()] = line.slice(col + 1).trim()
    }

    const disp = headers['content-disposition'] || ''
    const nameM = disp.match(/name="([^"]+)"/)
    const fileM = disp.match(/filename="([^"]+)"/)
    if (!nameM) continue

    if (fileM) {
      parts[nameM[1]] = {
        filename: fileM[1],
        contentType: headers['content-type'] || 'application/octet-stream',
        data: content,
      }
    } else {
      parts[nameM[1]] = content.toString('utf-8')
    }
  }
  return parts
}

function bufIndexOf(buf, search, from = 0) {
  const s = Buffer.isBuffer(search) ? search : Buffer.from(search)
  return buf.indexOf(s, from)
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function sendJson(res, status, body) {
  const data = JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) })
  res.end(data)
}

function noContent(res) {
  res.writeHead(204)
  res.end()
}

async function parseJsonBody(req) {
  const buf = await readBody(req)
  return JSON.parse(buf.toString('utf-8'))
}

// ---------------------------------------------------------------------------
// Route handlers (exported for testing)
// ---------------------------------------------------------------------------

export function createApi(storageDir) {
  const store = makeFs(storageDir)

  function handleFolders(req, res, url) {
    if (req.method === 'GET') {
      const parent = url.searchParams.get('parent') || null
      const parentId = parent === '' ? null : parent
      const folders = store.listFolders(parentId)
      return sendJson(res, 200, folders)
    }

    if (req.method === 'POST') {
      return parseJsonBody(req).then(body => {
        const parentId = body.parent || null
        const folder = store.createFolder(body.name, parentId)
        sendJson(res, 201, folder)
      })
    }

    sendJson(res, 405, { message: 'Method not allowed' })
  }

  function handleFolderById(req, res, id) {
    if (req.method === 'PATCH') {
      return parseJsonBody(req).then(body => {
        if (!store.folderExists(id)) return sendJson(res, 404, { message: 'Not found' })
        const updated = store.renameFolder(id, body.name)
        sendJson(res, 200, updated)
      })
    }

    if (req.method !== 'DELETE') return sendJson(res, 405, { message: 'Method not allowed' })

    if (!store.folderExists(id)) return sendJson(res, 404, { message: 'Not found' })
    store.deleteFolderRecursive(id)
    noContent(res)
  }

  function handleFiles(req, res, url) {
    if (req.method === 'GET') {
      const folder = url.searchParams.get('folder') || null
      const folderId = folder === '' ? null : folder
      const files = store.readMeta(folderId).map(({ _filename, ...rest }) => rest)
      return sendJson(res, 200, files)
    }

    if (req.method === 'POST') {
      const ct = req.headers['content-type'] || ''
      const bm = ct.match(/boundary=(.+)/)
      if (!bm) return sendJson(res, 400, { message: 'Missing boundary' })

      return readBody(req).then(buf => {
        const parts = parseMultipart(buf, bm[1].trim())
        const filePart = parts['file']
        if (!filePart?.data) return sendJson(res, 400, { message: 'Missing file' })

        const ext = path.extname(filePart.filename) || ''
        const storedName = uid() + ext
        const folderId = parts['folder'] || null
        const folderAbs = store.absPath(folderId)

        fs.mkdirSync(folderAbs, { recursive: true })
        fs.writeFileSync(path.join(folderAbs, storedName), filePart.data)

        const fileUrl = folderId
          ? `/storage/uploads/${folderId}/${storedName}`
          : `/storage/uploads/${storedName}`
        const isImage = /\.(jpe?g|png|gif|webp|svg|avif)$/i.test(ext)

        const file = {
          id: uid(),
          name: filePart.filename,
          url: fileUrl,
          size: filePart.data.length,
          folder: folderId,
          thumbnail: isImage ? fileUrl : '/storage/placeholder.svg',
          _filename: storedName,
        }

        const meta = store.readMeta(folderId)
        meta.push(file)
        store.writeMeta(folderId, meta)

        const { _filename, ...response } = file
        sendJson(res, 201, response)
      })
    }

    sendJson(res, 405, { message: 'Method not allowed' })
  }

  function handleFileById(req, res, id) {
    if (req.method !== 'DELETE') return sendJson(res, 405, { message: 'Method not allowed' })

    // Search all folders' metadata for this file id
    function findFile(dirId) {
      const meta = store.readMeta(dirId)
      const idx = meta.findIndex(f => String(f.id) === id)
      if (idx !== -1) return { meta, idx, folderId: dirId }

      const abs = store.absPath(dirId)
      if (!fs.existsSync(abs)) return null
      for (const name of fs.readdirSync(abs)) {
        if (name.startsWith('.')) continue
        const childAbs = path.join(abs, name)
        if (!fs.statSync(childAbs).isDirectory()) continue
        const childId = dirId ? `${dirId}/${name}` : name
        const found = findFile(childId)
        if (found) return found
      }
      return null
    }

    const found = findFile(null)
    if (!found) return sendJson(res, 404, { message: 'Not found' })

    const { meta, idx, folderId } = found
    const [file] = meta.splice(idx, 1)
    const fileAbs = path.join(store.absPath(folderId), file._filename)
    if (fs.existsSync(fileAbs)) fs.unlinkSync(fileAbs)
    store.writeMeta(folderId, meta)

    noContent(res)
  }

  function handleStaticUpload(req, res, subpath) {
    const filePath = path.join(store.uploadsDir, subpath)
    // Prevent path traversal
    const resolved = path.resolve(filePath)
    if (!resolved.startsWith(store.uploadsDir)) return sendJson(res, 403, { message: 'Forbidden' })
    if (!fs.existsSync(filePath)) return sendJson(res, 404, { message: 'File not found' })

    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) return sendJson(res, 404, { message: 'File not found' })

    const ext = path.extname(filePath).toLowerCase()
    const mime = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf', '.txt': 'text/plain',
    }[ext] || 'application/octet-stream'

    res.writeHead(200, { 'Content-Type': mime, 'Content-Length': stat.size })
    fs.createReadStream(filePath).pipe(res)
  }

  function handlePlaceholder(res) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#C6D0D6">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
    </svg>`
    res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Content-Length': Buffer.byteLength(svg) })
    res.end(svg)
  }

  function middleware(req, res, next) {
    const url = new URL(req.url, 'http://localhost')
    const p = url.pathname

    if (p.startsWith('/storage/uploads/')) {
      return handleStaticUpload(req, res, p.slice('/storage/uploads/'.length))
    }
    if (p === '/storage/placeholder.svg') {
      return handlePlaceholder(res)
    }
    if (!p.startsWith('/api/')) return next()

    let m
    try {
      if (p === '/api/folders') return handleFolders(req, res, url)
      if ((m = p.match(/^\/api\/folders\/(.+)$/))) return handleFolderById(req, res, decodeURIComponent(m[1]))
      if (p === '/api/files') return handleFiles(req, res, url)
      if ((m = p.match(/^\/api\/files\/(.+)$/))) return handleFileById(req, res, m[1])
      sendJson(res, 404, { message: 'Not found' })
    } catch (e) {
      console.error('[api]', e)
      sendJson(res, 500, { message: 'Internal server error' })
    }
  }

  return { init: store.init, middleware }
}

// ---------------------------------------------------------------------------
// Vite plugin
// ---------------------------------------------------------------------------

export function apiPlugin(options = {}) {
  const storageDir = options.storageDir || path.join(process.cwd(), 'server', 'storage')
  return {
    name: 'filemanager-api',
    configureServer(server) {
      const api = createApi(storageDir)
      api.init()
      server.middlewares.use(api.middleware)
    },
  }
}
