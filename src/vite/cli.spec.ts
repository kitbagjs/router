import { readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { expect, test, vi } from 'vitest'
import { runRouterCommand } from './cli'
import { createFixture } from './fixture'

const plugin = JSON.stringify(join(import.meta.dirname, 'index.ts'))

test('generates from the default config with its aliases and plugin options without running the app', async () => {
  const root = await createFixture({
    'pages/data.ts': "throw new Error('Application modules must not execute'); import { createLoader } from '@kitbag/router'; export const countries = createLoader({ load: () => ['US'] })",
    'pages/Page.vue': '<script setup lang="ts">import { useLoader } from "@kitbag/router"; import { countries } from "#/data"; useLoader(countries)</script>',
    'pages/registry.ts': 'import { createRoute } from "@kitbag/router"; import Page from "#/Page.vue"; export const home = createRoute({ name: "home" }).addView(Page)',
  })
  await writeFile(join(root, 'vite.config.mts'), `import router from ${plugin}
export default {
  root: ${JSON.stringify(root)},
  logLevel: 'silent',
  resolve: { alias: { '#': ${JSON.stringify(join(root, 'pages'))} } },
  plugins: [router({ routes: ['pages/registry.ts'], output: 'generated/routes.generated.ts' }), {
    name: 'forbid-server-and-build',
    configureServer() { throw new Error('Server started') },
    buildStart() { throw new Error('Build started') },
  }],
}`)
  await runRouterCommand(['generate', '--root', root])
  expect(await readFile(join(root, 'generated/routes.generated.ts'), 'utf8')).toContain('../pages/registry.generated')
  expect(await readFile(join(root, 'pages/registry.generated.ts'), 'utf8')).toContain('.addLoader(countries,')
  await expect(stat(join(root, 'dist'))).rejects.toThrow()
})

test('accepts a custom config and mode', async () => {
  const root = await createFixture({
    'pages/home.route.ts': 'import { createRoute } from "@kitbag/router"; export const home = createRoute({ name: "home" })',
  })
  const config = join(root, 'custom.config.mts')
  await writeFile(config, `import router from ${plugin}
export default ({ mode }) => ({
  root: ${JSON.stringify(root)},
  logLevel: 'silent',
  plugins: [router({ output: mode + '.generated.ts' })],
})`)
  await runRouterCommand(['generate', '--config', config, '--mode', 'staging'])
  expect(await readFile(join(root, 'staging.generated.ts'), 'utf8')).toContain('import { home }')
})

test('reports a missing router plugin', async () => {
  const root = await createFixture({ 'vite.config.mts': 'export default { logLevel: "silent" }' })
  await expect(runRouterCommand(['generate', '--root', root])).rejects.toThrow('Add router()')
})

test('reports generation errors', async () => {
  const root = await createFixture({ 'src/home.route.ts': 'export const home = (' })
  await writeFile(join(root, 'vite.config.mts'), `import router from ${plugin}
export default { root: ${JSON.stringify(root)}, logLevel: 'silent', plugins: [router()] }`)
  await expect(runRouterCommand(['generate', '--root', root])).rejects.toThrow('Cannot parse')
})

test('prints help without loading a config and rejects unknown arguments', async () => {
  const write = vi.spyOn(process.stdout, 'write').mockReturnValue(true)

  try {
    await runRouterCommand(['--help'])
    expect(write).toHaveBeenCalledWith(expect.stringContaining('Usage: router generate'))
  } finally {
    write.mockRestore()
  }

  await expect(runRouterCommand(['build'])).rejects.toThrow('Expected "router generate"')
  await expect(runRouterCommand(['generate', '--unknown'])).rejects.toThrow()
  await expect(runRouterCommand(['generate', '--config'])).rejects.toThrow()
})
