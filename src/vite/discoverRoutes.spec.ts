import { join } from 'node:path'
import { expect, test } from 'vitest'
import { discoverRoutes } from './discoverRoutes'
import { createFixture } from './fixture'

const countries = `import { createLoader } from '@kitbag/router'
export const countries = createLoader({ load: () => ['US'], prefetch: 'intent' })`
const select = `<script setup lang="ts">
import { useLoader as readLoader } from '@kitbag/router'
import { countries as definition } from './countries'
const { data } = await readLoader(definition)
</script><template><select><option v-for="country in data">{{ country }}</option></select></template>`

test('collects exported routes and loaders through rendered nested components', async () => {
  const root = await createFixture({
    'countries.ts': countries,
    'CountrySelect.vue': select,
    'Unused.vue': '<script setup>import { useLoader } from \'@kitbag/router\'; useLoader(missing)</script>',
    'Page.vue': '<script setup lang="ts">import CountrySelect from \'./CountrySelect.vue\'; import Unused from \'./Unused.vue\'</script><template><country-select /></template>',
    'home.route.ts': `import { createRoute } from '@kitbag/router'; import Page from './Page.vue'
const privateRoute = createRoute({ name: 'private' })
export const home = createRoute({ name: 'home' }).addView(Page)`,
  })
  const graph = await discoverRoutes([join(root, 'home.route.ts')])
  expect(graph.routeExports.map(({ name }) => name)).toEqual(['home'])
  expect(graph.routeExports[0].routes[0].componentLoaders.map(({ name }) => name)).toEqual(['countries'])
  expect(graph.diagnostics).toEqual([])
  expect(graph.parsedModules.has(join(root, 'Unused.vue'))).toBe(false)
})

test('resolves barrels, local aliases, explicit arrays, parents, and lazy views', async () => {
  const root = await createFixture({
    'countries.ts': countries,
    'CountrySelect.vue': select,
    'home.route.ts': `import { createRoute } from '@kitbag/router'; import { defineAsyncComponent } from 'vue'
export const parent = createRoute({ name: 'parent' })
export const child = createRoute({ parent, name: 'child' }).addView(defineAsyncComponent(() => import('./CountrySelect.vue')))`,
    'barrel.ts': 'export { child as home } from \'./home.route\'',
    'routes.ts': 'import { home } from \'./barrel\'; const alias = home; export const routes = [alias] as const',
  })
  const graph = await discoverRoutes([join(root, 'routes.ts')])
  expect(graph.routeExports[0].array).toBe(true)
  const [child] = graph.routeExports[0].routes
  expect(child.parent?.id).toBe(`${root}/home.route.ts#parent`)
  expect(child.componentLoaders[0].name).toBe('countries')
})

test('warns for setup-local definitions, skips explicit handles, and ignores unrelated functions', async () => {
  const root = await createFixture({
    'Page.vue': `<script setup lang="ts">
import { createLoader, useLoader } from '@kitbag/router'
const local = createLoader({ load: () => 'local' })
useLoader(local)
useLoader(route.loaders.user)
function other(useLoader: Function) { useLoader(local) }
</script>`,
    'home.route.ts': 'import { createRoute } from \'@kitbag/router\'; import Page from \'./Page.vue\'; export const home = createRoute({}).addView(Page)',
  })
  const graph = await discoverRoutes([join(root, 'home.route.ts')])
  expect(graph.routeExports[0].routes[0].componentLoaders).toEqual([])
  expect(graph.diagnostics).toEqual([expect.objectContaining({ file: join(root, 'Page.vue'), line: 4 })])
})

test('supports loader reexports and preserves definition identity across aliases', async () => {
  const root = await createFixture({
    'countries.ts': countries,
    'barrel.ts': 'export { countries as list } from \'./countries\'',
    'Page.vue': '<script setup lang="ts">import { useLoader } from \'@kitbag/router\'; import { list } from \'./barrel\'; const alias = list; useLoader(alias); useLoader(list)</script>',
    'home.route.ts': 'import { createRoute } from \'@kitbag/router\'; import Page from \'./Page.vue\'; export const home = createRoute({}).addView(Page)',
  })
  const graph = await discoverRoutes([join(root, 'home.route.ts')])
  expect(graph.routeExports[0].routes[0].componentLoaders).toEqual([{ id: `${root}/countries.ts#countries`, file: join(root, 'countries.ts'), name: 'countries' }])
})

test('terminates recursive component graphs without losing reachable loaders', async () => {
  const root = await createFixture({
    'countries.ts': countries,
    'A.vue': '<script setup lang="ts">import B from \'./B.vue\'</script><template><B /></template>',
    'B.vue': '<script setup lang="ts">import A from \'./A.vue\'; import { useLoader } from \'@kitbag/router\'; import { countries } from \'./countries\'; useLoader(countries)</script><template><A /></template>',
    'home.route.ts': 'import { createRoute } from \'@kitbag/router\'; import A from \'./A.vue\'; export const home = createRoute({}).addView(A)',
  })
  const graph = await discoverRoutes([join(root, 'home.route.ts')])
  expect(graph.routeExports[0].routes[0].componentLoaders).toHaveLength(1)
})

test('supports namespace APIs and keeps repeated explicit registrations', async () => {
  const root = await createFixture({
    'routes.ts': `import * as kitbag from '@kitbag/router'
const home = kitbag.createRoute({ name: 'home' })
export const labels = ['Home', 'Account']
export const routes = [home, home] as const`,
  })
  const graph = await discoverRoutes([join(root, 'routes.ts')])
  expect(graph.routeExports.map(({ name }) => name)).toEqual(['routes'])
  expect(graph.routeExports[0].routes).toHaveLength(2)
  expect(graph.routeExports[0].routes[0]).toBe(graph.routeExports[0].routes[1])
})

test('discovers default route exports and useLoader from router assets inside composables', async () => {
  const root = await createFixture({
    'countries.ts': countries,
    'assets.ts': 'import { createRouterAssets } from \'@kitbag/router\'; export const { useLoader } = createRouterAssets(routerKey)',
    'useCountries.ts': 'import { useLoader } from \'./assets\'; import { countries } from \'./countries\'; export function useCountries() { return useLoader(countries) }',
    'Page.vue': '<script setup lang="ts">import { useCountries } from \'./useCountries\'; const { data } = await useCountries()</script>',
    'home.route.ts': 'import { createRoute } from \'@kitbag/router\'; import Page from \'./Page.vue\'; export default createRoute({ name: \'home\' }).addView(Page)',
  })
  const graph = await discoverRoutes([join(root, 'home.route.ts')])
  expect(graph.routeExports[0].name).toBe('default')
  expect(graph.routeExports[0].routes[0].componentLoaders.map(({ name }) => name)).toEqual(['countries'])
  expect(graph.diagnostics).toEqual([])
})

test('follows reusable views and component barrels with default loader definitions', async () => {
  const root = await createFixture({
    'data.ts': 'import { createLoader } from \'@kitbag/router\'; export default createLoader({ load: () => 1 })',
    'Select.vue': '<script setup lang="ts">import { useLoader } from \'@kitbag/router\'; import data from \'./data\'; useLoader(data)</script>',
    'components.ts': 'export { default as Select } from \'./Select.vue\'',
    'Page.vue': '<script setup lang="ts">import { Select } from \'./components\'</script><template><Select /></template>',
    'view.ts': 'import { createView } from \'@kitbag/router\'; import Page from \'./Page.vue\'; export const view = createView({ component: Page })',
    'home.route.ts': 'import { createRoute } from \'@kitbag/router\'; import { view } from \'./view\'; export const home = createRoute({}).addView(view)',
  })
  const graph = await discoverRoutes([join(root, 'home.route.ts')])
  expect(graph.routeExports[0].routes[0].componentLoaders.map(({ name }) => name)).toEqual(['default'])
  expect(graph.diagnostics).toEqual([])
})

test('diagnoses opaque exported factories instead of silently dropping possible routes', async () => {
  const root = await createFixture({ 'home.route.ts': 'export const home = buildHomeRoute()' })
  const graph = await discoverRoutes([join(root, 'home.route.ts')])
  expect(graph.routeExports).toEqual([])
  expect(graph.diagnostics).toEqual([expect.objectContaining({ file: join(root, 'home.route.ts'), line: 1 })])
})
