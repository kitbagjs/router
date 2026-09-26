import { createServer } from 'vite'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'

const root = process.env.ROUTER_ROOT ?? resolve(import.meta.dirname, '../..')
const server = await createServer({
  configFile: false,
  root: import.meta.dirname,
  resolve: { alias: { '@': resolve(root, 'src') } },
  server: { hmr: false, host: '127.0.0.1', port: Number(process.env.PORT ?? 4173), strictPort: true, fs: { allow: [root] } },
  plugins: [{
    name: 'browser-proof',
    configureServer(server) {
      server.middlewares.use('/__head', (_request, response) => {
        response.end(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim())
      })
      server.middlewares.use('/__results', async (request, response) => {
        const chunks = []
        for await (const chunk of request) chunks.push(chunk)
        const results = Buffer.concat(chunks).toString()
        await writeFile(process.env.BROWSER_RESULTS ?? '/tmp/readiness-results.json', results)
        console.log(results)
        response.end('saved')
      })
    },
  }],
})
await server.listen()
server.printUrls()
