import { readFile, rm, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { build, createServer, isRunnableDevEnvironment, type InlineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { expect, onTestFinished, test, vi } from 'vitest'
import router from './index'
import type { Router } from '../types/router'
import type { Loader } from '../types/loader'
import type { RouteContext } from '../types/routeContext'
import { createFixture } from './fixture'
import { warnDiscovery } from './warnDiscovery'

vi.mock('./warnDiscovery', () => ({ warnDiscovery: vi.fn() }))

async function application(): Promise<{ root: string, config: InlineConfig }> {
  const root = await createFixture({
    'src/data.ts': 'import { createLoader } from \'@kitbag/router\'; export const countries = createLoader({ load: () => [\'US\'], prefetch: \'intent\' })',
    'src/Select.vue': '<script setup lang="ts">import { useLoader } from \'@kitbag/router\'; import { countries } from \'#/data\'; const { data } = await useLoader(countries)</script><template><select><option v-for="country in data">{{ country }}</option></select></template>',
    'src/Page.vue': '<script setup lang="ts">import Select from \'./Select.vue\'</script><template><Select /></template>',
    'src/home.route.ts': 'import { createRoute } from \'@kitbag/router\'; import Page from \'./Page.vue\'; export const home = createRoute({ name: \'home\', path: \'/\' }).addView(Page)',
    'src/main.ts': 'import { createRouter } from \'@kitbag/router\'; import { routes } from \'./routes.generated\'; export const router = createRouter(routes, { initialUrl: \'/\' })',
    'index.html': '<div id="app"></div><script type="module" src="/src/main.ts"></script>',
  })
  const config: InlineConfig = {
    root,
    configFile: false,
    logLevel: 'silent',
    resolve: {
      alias: {
        '@kitbag/router': resolve(import.meta.dirname, '../main.ts'),
        '@': resolve(import.meta.dirname, '..'),
        '#': join(root, 'src'),
        'vue/server-renderer': resolve(import.meta.dirname, '../../node_modules/vue/server-renderer/index.mjs'),
        'vue': resolve(import.meta.dirname, '../../node_modules/vue/dist/vue.runtime.esm-bundler.js'),
      },
    },
    plugins: [router(), vue()],
  }
  return { root, config }
}

test('generates before build resolution and honors Vite aliases', async () => {
  const { root, config } = await application()
  await build(config)
  const generated = await readFile(join(root, 'src/home.route.generated.ts'), 'utf8')
  expect(generated).toContain('.addLoader(')
  expect(generated).toContain('from "./data"')
})

test('regenerates on edits, additions, and removals, and reloads the development client', async () => {
  const { root, config } = await application()
  const server = await createServer({ ...config, server: { middlewareMode: true } })
  onTestFinished(() => server.close())
  const send = vi.spyOn(server.ws, 'send')
  const second = join(root, 'src/account.route.ts')
  await writeFile(second, 'import { createRoute } from \'@kitbag/router\'; export const account = createRoute({ name: \'account\' })')
  server.watcher.emit('add', second)
  await vi.waitFor(async () => {
    expect(await readFile(join(root, 'src/routes.generated.ts'), 'utf8')).toContain('import { account }')
  })
  await writeFile(join(root, 'src/Select.vue'), '<template><select /></template>')
  server.watcher.emit('change', join(root, 'src/Select.vue'))
  await vi.waitFor(async () => {
    expect(await readFile(join(root, 'src/home.route.generated.ts'), 'utf8')).not.toContain('.addLoader(')
  })
  await rm(second)
  server.watcher.emit('unlink', second)
  await vi.waitFor(async () => {
    expect(await readFile(join(root, 'src/routes.generated.ts'), 'utf8')).not.toContain('import { account }')
  })
  expect(send).toHaveBeenCalledWith({ type: 'full-reload' })
})

test('reports unsupported loader usage once while keeping the component source intact', async () => {
  const { root, config } = await application()
  const file = join(root, 'src/Select.vue')
  const source = '<script setup lang="ts">import { createLoader, useLoader } from \'@kitbag/router\'; const local = createLoader({ load: () => 1 }); useLoader(local)</script>'
  await writeFile(file, source)
  vi.mocked(warnDiscovery).mockClear()
  const server = await createServer({ ...config, server: { middlewareMode: true } })
  onTestFinished(() => server.close())
  expect(warnDiscovery).toHaveBeenCalledTimes(1)
  expect(warnDiscovery).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ file }))
  expect(await readFile(file, 'utf8')).toBe(source)
})

test('generated routes start the original loader before rendering components', async () => {
  const { root, config } = await application()
  await writeFile(join(root, 'src/data.ts'), `import { createLoader } from '@kitbag/router'
export const calls: string[] = []
export const countries = createLoader({ load: () => { calls.push('countries'); return ['US'] } })`)
  const server = await createServer({ ...config, server: { middlewareMode: true } })
  onTestFinished(() => server.close())
  const environment = server.environments.ssr

  if (!isRunnableDevEnvironment(environment)) {
    throw new Error('Expected a runnable SSR environment')
  }

  const app = await environment.runner.import<{ router: Router }>('/src/main.ts')
  const definitions = await environment.runner.import<{ countries: Loader, calls: string[] }>('/src/data.ts')
  onTestFinished(() => app.router.stop())
  await app.router.start()
  await vi.waitFor(() => expect(definitions.calls).toEqual(['countries']))
  expect(app.router.route.loaders.countries.load).toBe(definitions.countries.load)
})

test.each([false, true])('keeps loader context connected to generated routes (manual: %s)', async (manual) => {
  const { root, config } = await application()
  await writeFile(join(root, 'src/login.route.ts'), `import { createRoute } from '@kitbag/router'
export const login = createRoute({ name: 'login', path: '/login' })`)
  await writeFile(join(root, 'src/data.ts'), `import { createLoader } from '@kitbag/router'
import { login } from './login.route'
export const countries = createLoader({ context: [login], load: () => ['US'] })`)
  await writeFile(join(root, 'src/home.route.ts'), `import { createRoute } from '@kitbag/router'
import Page from './Page.vue'
${manual ? "import { countries } from './data'" : ''}
export const home = createRoute({ name: 'home', path: '/' }).addView(Page)${manual ? ".addLoader(countries, { name: 'countries' })" : ''}`)
  const server = await createServer({ ...config, server: { middlewareMode: true } })
  onTestFinished(() => server.close())
  const environment = server.environments.ssr

  if (!isRunnableDevEnvironment(environment)) {
    throw new Error('Expected a runnable SSR environment')
  }

  const app = await environment.runner.import<{ router: Router }>('/src/main.ts')
  const definitions = await environment.runner.import<{ countries: Loader<unknown, RouteContext[]> }>('/src/data.ts')
  const generated = await environment.runner.import<{ login: { id: string } }>('/src/login.route.generated.ts')
  onTestFinished(() => app.router.stop())
  await app.router.start()
  const loader = app.router.route.loaders.countries
  expect(loader.load).toBe(definitions.countries.load)
  expect(loader.context[0]).toBe(generated.login)
  expect(definitions.countries.context[0]).not.toBe(generated.login)
})

test('remaps the context of an imported reusable view', async () => {
  const { root, config } = await application()
  await writeFile(join(root, 'src/login.route.ts'), `import { createRoute } from '@kitbag/router'
export const login = createRoute({ name: 'login', path: '/login' })`)
  await writeFile(join(root, 'src/view.ts'), `import { createView } from '@kitbag/router'
import { login } from './login.route'
import Page from './Page.vue'
export const view = createView({ component: Page, context: [login] })`)
  await writeFile(join(root, 'src/home.route.ts'), `import { createRoute } from '@kitbag/router'
import { view } from './view'
export const home = createRoute({ name: 'home', path: '/' }).addView(view)`)
  const server = await createServer({ ...config, server: { middlewareMode: true } })
  onTestFinished(() => server.close())
  const environment = server.environments.ssr

  if (!isRunnableDevEnvironment(environment)) {
    throw new Error('Expected a runnable SSR environment')
  }

  const app = await environment.runner.import<{ router: Router }>('/src/main.ts')
  onTestFinished(() => app.router.stop())
  await app.router.start()
  expect(app.router.route.name).toBe('home')
  expect(app.router.route.loaders).toHaveProperty('countries')
})
