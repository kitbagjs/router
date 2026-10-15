// @vitest-environment node
import { mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { expect, test } from 'vitest'
import { createServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import { loaderDiscovery } from './plugin.mjs'

test('persistent generated modules follow loader edits, additions, and removals without rewriting routes', async () => {
  const root = await realpath(await mkdtemp(resolve(tmpdir(), 'kitbag-loader-updates-')))
  const sourceRoot = fileURLToPath(new URL('../../src', import.meta.url))
  const component = resolve(root, 'Card.vue')
  const routeSource = `import { createRoute } from '@kitbag/router'; import Card from './Card.vue'; export const card = createRoute({ name: 'card', path: '/' }).addView(Card)`
  const sfc = (value: string, extra = '') => `<script lang="ts">
import { defineLoader } from 'virtual:kitbag-loader-macros'
export const items = defineLoader(() => ${JSON.stringify(value)})
${extra}
</script><script setup lang="ts">const data = await items</script><template>{{ data }}</template>`
  await writeFile(resolve(root, 'routes.ts'), routeSource)
  await writeFile(component, sfc('before'))
  const compiler = loaderDiscovery({ routeFiles: ['routes.ts'] })
  const server = await createServer({
    configFile: false,
    root,
    logLevel: 'silent',
    plugins: [compiler, vue()],
    resolve: {
      alias: [
        { find: '@kitbag/router', replacement: resolve(sourceRoot, 'main.ts') },
        { find: '@', replacement: sourceRoot },
        { find: 'vue', replacement: createRequire(import.meta.url).resolve('vue/dist/vue.runtime.esm-bundler.js') },
      ],
    },
    server: { middlewareMode: true, watch: null, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  })
  const hookContext = {
    resolve: (id: string, importer: string, options: object) => server.environments.client.pluginContainer.resolveId(id, importer, options),
    addWatchFile() {},
  }
  const notify = async () => compiler.handleHotUpdate.call(hookContext, { file: component, server })
  try {
    await server.environments.client.pluginContainer.buildStart()
    const generatedUrl = '/.kitbag/routes.generated.ts'
    const initial = await server.transformRequest(generatedUrl)
    const extractedUrl = initial!.code.match(/from "([^"]*loaders\/Card[^"]+)"/)![1]
    expect((await server.transformRequest(extractedUrl))!.code).toContain('before')

    await writeFile(component, sfc('after'))
    await notify()
    expect((await server.transformRequest(extractedUrl))!.code).toContain('after')

    await writeFile(component, sfc('after', 'export const extra = defineLoader(() => 42)'))
    await notify()
    expect((await server.transformRequest(generatedUrl))!.code).toContain('extra as __kitbag_load_')

    await writeFile(component, '<script setup lang="ts">const data = "plain"</script><template>{{ data }}</template>')
    await notify()
    expect((await server.transformRequest(generatedUrl))!.code).not.toContain('.addLoader(')
    expect(await readFile(resolve(root, 'routes.ts'), 'utf8')).toBe(routeSource)
    await expect(readFile(resolve(root, '.kitbag/loaders/Card.ts'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
  } finally {
    await server.close()
    // Generated TypeScript remains available after the server is gone.
    expect(await readFile(resolve(root, '.kitbag/routes.generated.ts'), 'utf8')).toContain('export const card')
    await rm(root, { recursive: true, force: true })
  }
})
