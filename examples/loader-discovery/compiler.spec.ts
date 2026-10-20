// @vitest-environment node
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { mkdtemp, readFile, rm, stat, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { expect, test } from 'vitest'
import { compileScript, parse } from '@vue/compiler-sfc'
import { loaderDiscovery } from './plugin.mjs'
import { createGenerator } from './generator.mjs'

const root = fileURLToPath(new URL('.', import.meta.url))
const context = {
  addWatchFile() {},
  async resolve(specifier: string, importer: string) {
    return { id: resolve(dirname(importer), specifier) }
  },
}

function plugin(routeFiles: string[] = []) {
  const instance = loaderDiscovery({ routeFiles })
  instance.configResolved({ root })
  return instance
}

test('the emitted SFC binds the promise inside setup and remains valid Vue syntax', async () => {
  const source = `<script lang="ts">
import { defineLoader as loader } from 'virtual:kitbag-loader-macros'
export const countries = loader(async () => ['US'])
</script><script setup lang="ts">const options = await countries</script>`
  const result = await plugin().transform.call(context, source, resolve(root, 'Fixture.vue'))
  const { descriptor, errors } = parse(result.code)
  expect(errors).toEqual([])
  const compiled = compileScript(descriptor, { id: 'fixture' }).content
  expect(compiled).toContain('const countries = __kitbag_useLoaderPromise(')
  expect(compiled).toContain('.kitbag/loaders/')
  expect(compiled).not.toContain('loader(async')
})

test('a shared loader is not registered again on a child that inherits it', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'kitbag-parent-'))
  try {
    await writeFile(resolve(directory, 'Page.vue'), `<script lang="ts">import { defineLoader } from 'virtual:kitbag-loader-macros'; export const items = defineLoader(() => 1)</script><script setup lang="ts">const data = await items</script><template>{{ data }}</template>`)
    await writeFile(resolve(directory, 'routes.ts'), `import { createRoute } from '@kitbag/router'
import Page from './Page.vue'
export const parent = createRoute({ name: 'parent', path: '/parent' }).addView(Page)
export const child = createRoute({ parent, name: 'child', path: '/child' }).addView(Page)`)
    await createGenerator({ root: directory, routeFiles: ['routes.ts'] }).generate()
    expect((await readFile(resolve(directory, '.kitbag/routes.generated.ts'), 'utf8')).match(/\.addLoader\(__kitbag_load_/g)).toHaveLength(1)
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test.each([
  [
    `<script setup lang="ts">import { defineLoader } from 'virtual:kitbag-loader-macros'; const data = defineLoader(() => 1)</script>`,
    'normal <script>',
  ],
  [
    `<script lang="ts">import { defineLoader } from 'virtual:kitbag-loader-macros'; export const data = defineLoader(to => to.params.id)</script><script setup lang="ts">const value = await data</script>`,
    'no parameters',
  ],
  [
    `<script lang="ts">import { defineLoader } from 'virtual:kitbag-loader-macros'; console.log('side effect'); export const data = defineLoader(() => 1)</script><script setup lang="ts">const value = await data</script>`,
    'imports and exported const',
  ],
])('rejects unsupported macro usage with a diagnostic', async (source, message) => {
  await expect(plugin().transform.call(context, source, resolve(root, 'Fixture.vue'))).rejects.toThrow(message)
})

test('dynamic view construction is rejected rather than silently missing loaders', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'kitbag-dynamic-'))
  try {
    await writeFile(resolve(directory, 'routes.ts'), `import { createRoute } from '@kitbag/router'; const page = createRoute({ name: 'page', path: '/' }).addView(getPage())`)
    await expect(createGenerator({ root: directory, routeFiles: ['routes.ts'] }).generate()).rejects.toThrow('Cannot discover the view')
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('standalone generation leaves authored source and unchanged output untouched', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'kitbag-static-'))
  const routeSource = `import { createRoute } from '@kitbag/router'; import Page from './Page.vue'; export const page = createRoute({ name: 'page', path: '/' }).addView(Page)`
  try {
    await writeFile(resolve(directory, 'routes.ts'), routeSource)
    await writeFile(resolve(directory, 'Page.vue'), `<script lang="ts">import { defineLoader } from 'virtual:kitbag-loader-macros'; export const items = defineLoader((): string[] => ['item'])</script><script setup lang="ts">const data = await items</script><template>{{ data }}</template>`)
    const generator = createGenerator({ root: directory, routeFiles: ['routes.ts'] })
    await generator.generate()
    const output = resolve(directory, '.kitbag/routes.generated.ts')
    await utimes(output, new Date(0), new Date(0))
    await generator.generate()
    expect((await stat(output)).mtimeMs).toBe(0)
    expect(await readFile(resolve(directory, 'routes.ts'), 'utf8')).toBe(routeSource)
    expect(await readFile(resolve(directory, '.kitbag/loaders/Page.ts'), 'utf8')).toContain('(): string[]')
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('distinct loaders with the same export name produce a collision diagnostic', async () => {
  const directory = await mkdtemp(resolve(tmpdir(), 'kitbag-collision-'))
  try {
    const component = `<script lang="ts">import { defineLoader } from 'virtual:kitbag-loader-macros'; export const items = defineLoader(() => 1)</script><script setup lang="ts">const data = await items</script><template>{{ data }}</template>`
    await writeFile(resolve(directory, 'One.vue'), component)
    await writeFile(resolve(directory, 'Two.vue'), component)
    await writeFile(resolve(directory, 'routes.ts'), `import { createRoute } from '@kitbag/router'; import One from './One.vue'; import Two from './Two.vue'; export const page = createRoute({ name: 'page', path: '/' }).addView(One).addView(Two, { name: 'sidebar' })`)
    await expect(createGenerator({ root: directory, routeFiles: ['routes.ts'] }).generate()).rejects.toThrow('Loader name items conflicts')
  } finally { await rm(directory, { recursive: true, force: true }) }
})
