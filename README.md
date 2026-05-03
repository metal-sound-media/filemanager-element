# file-manager custom element

[![npm](https://img.shields.io/npm/v/filemanager-element.svg)](http://npm.im/filemanager-element)
[![Test](https://github.com/Grafikart/FileManagerJS/actions/workflows/test.yml/badge.svg)](https://github.com/Grafikart/FileManagerJS/actions/workflows/test.yml)

![](./screenshot.jpg)

A simple file browser custom element — no framework, pure vanilla JavaScript, zero runtime dependencies.

## Installation

### Via npm / bundler

```js
import { FileManager } from 'filemanager-element'
import 'filemanager-element/FileManager.css'

FileManager.register()
```

### Standalone (no build step)

```html
<script type="module" src="FileManager.standalone.js"></script>
```

### Direct source import (e.g. symfony/asset-mapper)

Since the library is plain ES modules with no compilation required, you can import the source directly:

```js
import { FileManager } from '/path/to/src/FileManager.js'
```

---

Then use the custom element anywhere in your HTML:

```html
<file-manager endpoint="http://your.api.com/endpoint"></file-manager>
```

Implement the API following this [Open API specification](openapi.yml) and it will work out of the box.

To interface the element with your system:

```js
const filemanager = document.querySelector("file-manager")

filemanager.addEventListener("close", () => {
  console.log("close")
})

filemanager.addEventListener("selectfile", e => {
  console.log("fileSelected", e.detail)
})
```

## Attributes

| Attribute    | Description                                                 | Default |
|--------------|-------------------------------------------------------------|---------|
| endpoint     | The base url for the file and folder API                    |         |
| readonly     | Do not allow file deletion or creation                      | false   |
| layout       | Files layout "rows" or "grid"                               | grid    |
| lazy-folders | Should all folder be lazy loaded with a new call to the API | false   |
| hidden       | Work like the default HTML attribute                        | false   |

## Events

| Name        | Description                                        |
|-------------|----------------------------------------------------|
| close       | The user clicked on the overlay to close the modal |
| selectfile  | The user selected a file                           |

### Accessing selected file data

When the user clicks a file, the `selectfile` event fires on the element. `e.detail` contains the file object:

| Field     | Type             | Description                     |
|-----------|------------------|---------------------------------|
| id        | string \| number | File identifier                 |
| name      | string           | File name                       |
| url       | string           | Public URL                      |
| thumbnail | string           | Thumbnail URL                   |
| size      | number           | File size in bytes (optional)   |
| folder    | string \| number | Parent folder id (optional)     |

```js
const filemanager = document.querySelector('file-manager')

filemanager.addEventListener('selectfile', e => {
  const file = e.detail
  alert(file.url)     // public URL of the file
  console.log(file)   // { id, name, url, thumbnail, size, folder }
})
```

## Options

Options can be set on the `register()` method as a second argument. All options are optional.

| Name            | Type     | Description                                |
|-----------------|----------|--------------------------------------------|
| readOnly        | bool     | Do not allow file deletion or creation     |
| endpoint        | string   | Endpoint for the REST API                  |
| httpHeaders     | object   | Additional headers to send to the endpoint |
| getFiles()      | function | Custom function to retrieve files          |
| getFolders()    | function | Custom function to retrieve folders        |
| deleteFile()    | function | Custom function to delete a file           |
| deleteFolder()  | function | Custom function to delete a folder         |
| uploadFile()    | function | Custom function to upload a file           |
| createFolder()  | function | Custom function to create a folder         |

## Custom API

If you do not use a traditional REST API you can provide your own functions:

```js
FileManager.register('my-file-manager', {
  getFiles(folder) {
    // return Promise<File[]>
  },
  getFolders(parent) {
    // return Promise<Folder[]>
  },
  createFolder(params) {
    // params: { name, parent }
    // return Promise<Folder>
  },
  deleteFile(file) {
    // return Promise<void>
  },
  deleteFolder(folder) {
    // return Promise<void>
  },
  uploadFile(file, folder) {
    // return Promise<File>
  }
})
```

## API implementation examples

Two reference implementations are provided:

### Node.js / Vite dev server (`server/api.js`)

A ready-to-use in-memory + filesystem backend built as a Vite plugin. It stores metadata in `server/storage/db.json` and uploaded files in `server/storage/uploads/`. Used automatically when running the dev server.

```js
import { apiPlugin } from './server/api.js'
// Used in vite.config.js — see source for details
```

### Laravel (`example/laravel/`)

Controllers and Form Request classes showing how to implement the API with Laravel's Storage facade. The folder tree is derived from the filesystem path hierarchy, so no database is required.

---

## Development

No local Node.js required — use Docker:

### Start the dev server

```sh
docker-compose up dev
```

Open http://localhost:3000. The "API based manager" is fully functional with a local backend.

### Run tests

```sh
# End-to-end UI tests (Playwright)
docker-compose run --rm test

# API unit tests (Node.js built-in runner)
docker-compose run --rm dev npm run test:api
```

### Build the library

```sh
docker-compose run --rm dev npm run build
```

Outputs:
- `dist/FileManager.js` — ES module (import in bundler or asset-mapper)
- `dist/FileManager.standalone.js` — standalone bundle (no external deps)
- `dist/FileManager.css` — stylesheet
