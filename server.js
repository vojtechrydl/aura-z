// Minimal production static server for the built SPA (used by Railway).
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, 'dist')
const port = process.env.PORT || 3000

const app = express()
app.use(express.static(distDir, { extensions: ['html'] }))

// SPA fallback: any non-file route serves index.html so client-side routing
// (none yet, but future-proof) and refreshes don't 404. Plain `app.use`
// (rather than `app.get('*', ...)`) because Express 5's path-to-regexp no
// longer accepts a bare `*` wildcard path.
app.use((_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})

app.listen(port, () => {
  console.log(`Aura Z running on http://localhost:${port}`)
})
