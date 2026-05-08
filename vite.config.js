import { defineConfig } from 'vite'
import path from 'path'
import { apiPlugin } from './server/api.js'

const standalone = process.env.STANDALONE

export default defineConfig({
  server: {
    port: 3000,
    host: true,
  },
  plugins: [
    // API middleware only for dev server (not for builds)
    !standalone && apiPlugin(),
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        assetFileNames: assetInfo => {
          if (assetInfo.name === 'style.css') return 'FileManager.css'
          return assetInfo.name
        },
      },
      external: standalone
        ? []
        : id => !id.startsWith('\0') && !id.startsWith('.') && !id.startsWith('/'),
    },
    emptyOutDir: !standalone,
    minify: false,
    lib: {
      entry: path.resolve('src/FileManager.js'),
      name: 'FileManager',
      formats: ['es'],
      fileName: () => standalone ? 'FileManager.standalone.js' : 'FileManager.js',
    },
  },
})
