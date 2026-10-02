import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

// Run with `node scripts/test-navigation-api.mjs`. Set CHROME_PATH outside macOS.
const root = fileURLToPath(new URL('../', import.meta.url))
const profile = await mkdtemp(join(tmpdir(), 'kitbag-navigation-'))
const server = await createServer({
  configFile: false,
  root,
  resolve: { alias: { '@': join(root, 'src') } },
  server: { host: '127.0.0.1', port: 0 },
  plugins: [{
    name: 'navigation-fixture',
    configureServer(server) {
      server.middlewares.use('/__navigation', (_request, response) => {
        response.setHeader('Content-Type', 'text/html')
        response.end(`<!doctype html><body>
          <pre id="results">running</pre>
          <div id="app"></div>
          <script type="module" src="/scripts/fixtures/navigationApi.js"></script>
        </body>`)
      })
    },
  }],
})

let chrome
let socket

try {
  await server.listen()
  const address = server.httpServer.address()
  const url = `http://127.0.0.1:${address.port}/__navigation`

  chrome = spawn(process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--remote-debugging-port=0',
    `--user-data-dir=${profile}`,
    'about:blank',
  ], { stdio: 'ignore' })
  let launchError

  chrome.on('error', (error) => {
    launchError = error
  })

  let debugPort

  for (let attempt = 0; attempt < 100; attempt++) {
    if (launchError) {
      throw launchError
    }

    try {
      debugPort = (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]
      break
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
  }

  if (!debugPort) {
    throw new Error('Chrome did not start. Set CHROME_PATH to a browser supporting precommit interception.')
  }

  const pages = await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json()
  const page = pages.find((page) => page.type === 'page')

  socket = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }))
  let nextId = 0
  const pending = new Map()
  const exceptions = []

  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data)

    if (message.id) {
      pending.get(message.id)?.(message)
      pending.delete(message.id)
    } else if (message.method === 'Runtime.exceptionThrown') {
      exceptions.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text)
    }
  })

  async function send(method, params = {}) {
    const id = ++nextId
    const response = await new Promise((resolve) => {
      pending.set(id, resolve)
      socket.send(JSON.stringify({ id, method, params }))
    })

    if (response.error) {
      throw new Error(response.error.message)
    }

    return response.result
  }

  await send('Runtime.enable')
  await send('Page.navigate', { url })
  let outcome

  for (let attempt = 0; attempt < 300; attempt++) {
    const response = await send('Runtime.evaluate', {
      expression: 'document.getElementById("results")?.textContent',
      returnByValue: true,
    })
    const value = response.result?.value

    if (value && value !== 'running') {
      outcome = JSON.parse(value)
      break
    }

    if (exceptions.length) {
      throw new Error(exceptions.join('\n'))
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  if (!outcome) {
    throw new Error('Navigation fixture did not finish')
  }

  for (const result of outcome.results) {
    console.log(`✓ ${result}`)
  }

  if (outcome.error) {
    throw new Error(outcome.stack ?? outcome.error)
  }

  console.log(`${outcome.passed} native browser checks passed`)
} catch (error) {
  console.error(error)
  process.exitCode = 1
} finally {
  socket?.close()

  if (chrome && chrome.exitCode === null && chrome.pid) {
    const exited = new Promise((resolve) => chrome.once('exit', resolve))

    chrome.kill()
    await exited
  }

  await server.close()
  await rm(profile, { recursive: true, force: true })
}
