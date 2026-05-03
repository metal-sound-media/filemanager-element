import { test, describe, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createApi } from '../../server/api.js'

// ---------------------------------------------------------------------------
// Test server setup
// ---------------------------------------------------------------------------

let server
let base
let storageDir

before(async () => {
  storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fm-api-test-'))
  const api = createApi(storageDir)
  api.init()

  server = http.createServer((req, res) => {
    api.middleware(req, res, () => {
      res.writeHead(404)
      res.end('Not found')
    })
  })

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  base = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise(resolve => server.close(resolve))
  fs.rmSync(storageDir, { recursive: true, force: true })
})

// Clear all uploads between tests so each test starts clean
beforeEach(() => {
  const uploadsDir = path.join(storageDir, 'uploads')
  for (const entry of fs.readdirSync(uploadsDir)) {
    const entryPath = path.join(uploadsDir, entry)
    if (entry.startsWith('.')) continue
    const stat = fs.statSync(entryPath)
    if (stat.isDirectory()) {
      fs.rmSync(entryPath, { recursive: true, force: true })
    } else {
      fs.unlinkSync(entryPath)
    }
  }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function req(method, url, body, contentType) {
  const opts = { method, headers: {} }
  if (body) {
    if (typeof body === 'string') {
      opts.body = body
      opts.headers['Content-Type'] = contentType || 'application/json'
    } else {
      opts.body = body
      opts.headers['Content-Type'] = contentType
    }
  }
  const res = await fetch(base + url, opts)
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: res.status, json, text, headers: res.headers }
}

function buildMultipart(fields, fileField, filename, fileData, mimeType) {
  const boundary = '----TestBoundary' + Date.now()
  const parts = []

  for (const [name, value] of Object.entries(fields)) {
    parts.push(
      `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}`
    )
  }

  const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
  const footer = `\r\n--${boundary}--`

  const headerBuf = Buffer.from(parts.join('\r\n') + (parts.length ? '\r\n' : '') + fileHeader)
  const footerBuf = Buffer.from(footer)
  const body = Buffer.concat([headerBuf, fileData, footerBuf])

  return { body, contentType: `multipart/form-data; boundary=${boundary}` }
}

const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

// Convert a /storage/uploads/... URL to an absolute disk path
function urlToDiskPath(url) {
  return path.join(storageDir, url.replace(/^\/storage\//, ''))
}

// ---------------------------------------------------------------------------
// Folders
// ---------------------------------------------------------------------------

describe('GET /api/folders', () => {
  test('returns empty array when no folders exist', async () => {
    const r = await req('GET', '/api/folders')
    assert.equal(r.status, 200)
    assert.deepEqual(r.json, [])
  })

  test('returns root folders', async () => {
    await req('POST', '/api/folders', JSON.stringify({ name: 'Root A', parent: null }))
    await req('POST', '/api/folders', JSON.stringify({ name: 'Root B', parent: null }))
    const r = await req('GET', '/api/folders')
    assert.equal(r.status, 200)
    assert.equal(r.json.length, 2)
    assert.ok(r.json.some(f => f.name === 'Root A'))
    assert.ok(r.json.some(f => f.name === 'Root B'))
  })

  test('root folders have parent=null', async () => {
    await req('POST', '/api/folders', JSON.stringify({ name: 'MyFolder' }))
    const r = await req('GET', '/api/folders')
    assert.equal(r.json[0].parent, null)
  })

  test('filters folders by parent id', async () => {
    const parent = (await req('POST', '/api/folders', JSON.stringify({ name: 'Parent', parent: null }))).json
    await req('POST', '/api/folders', JSON.stringify({ name: 'Child', parent: parent.id }))
    await req('POST', '/api/folders', JSON.stringify({ name: 'Other root', parent: null }))

    const r = await req('GET', `/api/folders?parent=${parent.id}`)
    assert.equal(r.status, 200)
    assert.equal(r.json.length, 1)
    assert.equal(r.json[0].name, 'Child')
    assert.equal(String(r.json[0].parent), String(parent.id))
  })

  test('returns 405 for unsupported methods', async () => {
    const r = await req('PUT', '/api/folders')
    assert.equal(r.status, 405)
  })
})

describe('POST /api/folders', () => {
  test('creates a root folder and returns {id, name, parent}', async () => {
    const r = await req('POST', '/api/folders', JSON.stringify({ name: 'Images' }))
    assert.equal(r.status, 201)
    assert.equal(r.json.name, 'Images')
    assert.equal(r.json.parent, null)
    assert.ok(r.json.id)
  })

  test('creates a real directory on disk', async () => {
    const r = await req('POST', '/api/folders', JSON.stringify({ name: 'RealDir' }))
    const dirPath = path.join(storageDir, 'uploads', 'RealDir')
    assert.ok(fs.existsSync(dirPath), 'directory should exist on disk')
    assert.ok(fs.statSync(dirPath).isDirectory())
  })

  test('creates a nested folder', async () => {
    const parent = (await req('POST', '/api/folders', JSON.stringify({ name: 'Parent' }))).json
    const r = await req('POST', '/api/folders', JSON.stringify({ name: 'Child', parent: parent.id }))
    assert.equal(r.status, 201)
    assert.equal(r.json.name, 'Child')
    assert.equal(String(r.json.parent), String(parent.id))
  })

  test('nested folder exists as a real subdirectory on disk', async () => {
    const parent = (await req('POST', '/api/folders', JSON.stringify({ name: 'Parent' }))).json
    await req('POST', '/api/folders', JSON.stringify({ name: 'Sub', parent: parent.id }))
    const subPath = path.join(storageDir, 'uploads', 'Parent', 'Sub')
    assert.ok(fs.existsSync(subPath))
    assert.ok(fs.statSync(subPath).isDirectory())
  })

  test('persists folder (visible in subsequent GET)', async () => {
    await req('POST', '/api/folders', JSON.stringify({ name: 'Persistent' }))
    const r = await req('GET', '/api/folders')
    assert.ok(r.json.some(f => f.name === 'Persistent'))
  })
})

describe('PATCH /api/folders/:id', () => {
  test('renames a folder and returns updated name', async () => {
    const folder = (await req('POST', '/api/folders', JSON.stringify({ name: 'Original' }))).json
    const r = await req('PATCH', `/api/folders/${folder.id}`, JSON.stringify({ name: 'Renamed' }))
    assert.equal(r.status, 200)
    assert.equal(r.json.name, 'Renamed')
    assert.equal(r.json.parent, null)
  })

  test('persists the new name (visible in GET)', async () => {
    const folder = (await req('POST', '/api/folders', JSON.stringify({ name: 'Before' }))).json
    await req('PATCH', `/api/folders/${folder.id}`, JSON.stringify({ name: 'After' }))
    const list = await req('GET', '/api/folders')
    assert.ok(list.json.some(f => f.name === 'After'))
    assert.ok(!list.json.some(f => f.name === 'Before'))
  })

  test('renames the actual directory on disk', async () => {
    const folder = (await req('POST', '/api/folders', JSON.stringify({ name: 'OldName' }))).json
    await req('PATCH', `/api/folders/${folder.id}`, JSON.stringify({ name: 'NewName' }))
    const oldPath = path.join(storageDir, 'uploads', 'OldName')
    const newPath = path.join(storageDir, 'uploads', 'NewName')
    assert.ok(!fs.existsSync(oldPath))
    assert.ok(fs.existsSync(newPath))
  })

  test('returns 404 for unknown folder', async () => {
    const r = await req('PATCH', '/api/folders/nonexistent', JSON.stringify({ name: 'X' }))
    assert.equal(r.status, 404)
  })
})

describe('DELETE /api/folders/:id', () => {
  test('deletes a folder and returns 204', async () => {
    const folder = (await req('POST', '/api/folders', JSON.stringify({ name: 'ToDelete' }))).json
    const r = await req('DELETE', `/api/folders/${folder.id}`)
    assert.equal(r.status, 204)
    const list = await req('GET', '/api/folders')
    assert.ok(!list.json.some(f => f.name === 'ToDelete'))
  })

  test('removes the directory from disk', async () => {
    const folder = (await req('POST', '/api/folders', JSON.stringify({ name: 'ByeBye' }))).json
    const dirPath = path.join(storageDir, 'uploads', 'ByeBye')
    assert.ok(fs.existsSync(dirPath))
    await req('DELETE', `/api/folders/${folder.id}`)
    assert.ok(!fs.existsSync(dirPath))
  })

  test('returns 404 for unknown folder', async () => {
    const r = await req('DELETE', '/api/folders/nonexistent')
    assert.equal(r.status, 404)
  })

  test('cascade-deletes sub-folders', async () => {
    const parent = (await req('POST', '/api/folders', JSON.stringify({ name: 'Parent' }))).json
    await req('POST', '/api/folders', JSON.stringify({ name: 'Child', parent: parent.id }))
    await req('DELETE', `/api/folders/${parent.id}`)
    const r = await req('GET', '/api/folders')
    assert.equal(r.json.length, 0)
  })

  test('cascade-deletes files inside folder and removes them from disk', async () => {
    const folder = (await req('POST', '/api/folders', JSON.stringify({ name: 'WithFiles' }))).json
    const { body, contentType } = buildMultipart({ folder: folder.id }, 'file', 'img.png', TINY_PNG, 'image/png')
    const uploaded = (await req('POST', '/api/files', body, contentType)).json
    const uploadedPath = urlToDiskPath(uploaded.url)

    assert.ok(fs.existsSync(uploadedPath), 'file should exist before delete')

    await req('DELETE', `/api/folders/${folder.id}`)
    assert.ok(!fs.existsSync(uploadedPath), 'file should be removed from disk')

    const files = await req('GET', `/api/files?folder=${folder.id}`)
    assert.equal(files.json.length, 0)
  })
})

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

describe('GET /api/files', () => {
  test('returns empty array when no files exist', async () => {
    const r = await req('GET', '/api/files')
    assert.equal(r.status, 200)
    assert.deepEqual(r.json, [])
  })

  test('filters files by folder', async () => {
    const folder = (await req('POST', '/api/folders', JSON.stringify({ name: 'Pics' }))).json
    const { body, contentType } = buildMultipart({ folder: folder.id }, 'file', 'a.png', TINY_PNG, 'image/png')
    await req('POST', '/api/files', body, contentType)

    const inFolder = await req('GET', `/api/files?folder=${folder.id}`)
    assert.equal(inFolder.json.length, 1)
    assert.equal(inFolder.json[0].name, 'a.png')

    const root = await req('GET', '/api/files')
    assert.equal(root.json.length, 0)
  })

  test('does not expose _filename in response', async () => {
    const folder = (await req('POST', '/api/folders', JSON.stringify({ name: 'F' }))).json
    const { body, contentType } = buildMultipart({ folder: folder.id }, 'file', 'x.png', TINY_PNG, 'image/png')
    await req('POST', '/api/files', body, contentType)
    const r = await req('GET', `/api/files?folder=${folder.id}`)
    assert.ok(!('_filename' in r.json[0]))
  })
})

describe('POST /api/files', () => {
  test('uploads a file and returns file metadata', async () => {
    const folder = (await req('POST', '/api/folders', JSON.stringify({ name: 'Uploads' }))).json
    const { body, contentType } = buildMultipart({ folder: folder.id }, 'file', 'photo.png', TINY_PNG, 'image/png')
    const r = await req('POST', '/api/files', body, contentType)

    assert.equal(r.status, 201)
    assert.equal(r.json.name, 'photo.png')
    assert.ok(r.json.url.startsWith('/storage/uploads/'))
    assert.ok(r.json.thumbnail.startsWith('/storage/uploads/'))
    assert.equal(r.json.size, TINY_PNG.length)
    assert.equal(String(r.json.folder), String(folder.id))
  })

  test('saves file inside the folder directory on disk', async () => {
    const folder = (await req('POST', '/api/folders', JSON.stringify({ name: 'MyFolder' }))).json
    const { body, contentType } = buildMultipart({ folder: folder.id }, 'file', 'img.png', TINY_PNG, 'image/png')
    const r = await req('POST', '/api/files', body, contentType)
    const diskPath = urlToDiskPath(r.json.url)
    assert.ok(fs.existsSync(diskPath))
    assert.deepEqual(fs.readFileSync(diskPath), TINY_PNG)
    // File should be inside the folder directory
    const folderDir = path.join(storageDir, 'uploads', folder.id)
    assert.ok(diskPath.startsWith(folderDir), `file should be inside ${folderDir}`)
  })

  test('uses placeholder thumbnail for non-image files', async () => {
    const { body, contentType } = buildMultipart({}, 'file', 'doc.pdf', Buffer.from('%PDF'), 'application/pdf')
    const r = await req('POST', '/api/files', body, contentType)
    assert.equal(r.json.thumbnail, '/storage/placeholder.svg')
  })

  test('returns 400 when no file part is provided', async () => {
    const boundary = '----TestBoundary'
    const body = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="folder"\r\n\r\nsome-id\r\n--${boundary}--`)
    const r = await req('POST', '/api/files', body, `multipart/form-data; boundary=${boundary}`)
    assert.equal(r.status, 400)
  })
})

describe('DELETE /api/files/:id', () => {
  test('deletes a file and returns 204', async () => {
    const folder = (await req('POST', '/api/folders', JSON.stringify({ name: 'F' }))).json
    const { body, contentType } = buildMultipart({ folder: folder.id }, 'file', 'del.png', TINY_PNG, 'image/png')
    const file = (await req('POST', '/api/files', body, contentType)).json

    const r = await req('DELETE', `/api/files/${file.id}`)
    assert.equal(r.status, 204)

    const list = await req('GET', `/api/files?folder=${folder.id}`)
    assert.equal(list.json.length, 0)
  })

  test('removes file from disk on delete', async () => {
    const folder = (await req('POST', '/api/folders', JSON.stringify({ name: 'F' }))).json
    const { body, contentType } = buildMultipart({ folder: folder.id }, 'file', 'rm.png', TINY_PNG, 'image/png')
    const file = (await req('POST', '/api/files', body, contentType)).json
    const diskPath = urlToDiskPath(file.url)

    await req('DELETE', `/api/files/${file.id}`)
    assert.ok(!fs.existsSync(diskPath))
  })

  test('returns 404 for unknown file', async () => {
    const r = await req('DELETE', '/api/files/doesnotexist')
    assert.equal(r.status, 404)
  })
})

// ---------------------------------------------------------------------------
// Static file serving
// ---------------------------------------------------------------------------

describe('GET /storage/uploads/...', () => {
  test('serves an uploaded image with correct content-type', async () => {
    const folder = (await req('POST', '/api/folders', JSON.stringify({ name: 'F' }))).json
    const { body, contentType } = buildMultipart({ folder: folder.id }, 'file', 'pic.png', TINY_PNG, 'image/png')
    const file = (await req('POST', '/api/files', body, contentType)).json

    const r = await fetch(base + file.url)
    assert.equal(r.status, 200)
    assert.ok(r.headers.get('content-type').includes('image/png'))
    const buf = Buffer.from(await r.arrayBuffer())
    assert.deepEqual(buf, TINY_PNG)
  })

  test('returns 404 for unknown file', async () => {
    const r = await fetch(`${base}/storage/uploads/nonexistent.png`)
    assert.equal(r.status, 404)
  })
})

describe('GET /storage/placeholder.svg', () => {
  test('returns an SVG placeholder', async () => {
    const r = await fetch(`${base}/storage/placeholder.svg`)
    assert.equal(r.status, 200)
    assert.ok(r.headers.get('content-type').includes('image/svg+xml'))
    const text = await r.text()
    assert.ok(text.includes('<svg'))
  })
})
