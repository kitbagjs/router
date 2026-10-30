import { expect, test } from 'vitest'
import { defineComponent } from 'vue'
import { createRoute } from '@/services/createRoute'
import { createRouterNavigation } from '@/services/createRouterNavigation'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { getComputations } from '@/services/getComputations'
import { LoaderDataAccessError } from '@/errors/loaderDataAccessError'

const Page = defineComponent({ props: { value: { type: String, required: true } } })

test('getData() keeps selecting the default loader after another loader is added', async () => {
  const route = createRoute({ path: '/' })
    .addLoader(() => 'first')
    .addView(Page, { props: async (route) => ({ value: await route.getData() }) })
    .addLoader(() => 'later', { name: 'later' })
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()

  navigation.commit({ to: resolved, from: null })

  await expect(navigation.getProps(route.id, 'default', resolved)).resolves.toEqual({ kind: 'value', value: { value: 'first' } })
  navigation.stop()
})

test('a parent callback still selects its default loader when a child adds a loader', async () => {
  const parent = createRoute({ path: '/parent' })
    .addLoader(() => 'first')
    .addView(Page, { props: async (route) => ({ value: await route.getData('default') }) })
  const child = createRoute({ parent, path: '/child' }).addLoader(() => 'later', { name: 'later' })
  const resolved = createResolvedRoute(child)
  const navigation = createRouterNavigation()

  navigation.commit({ to: resolved, from: null })

  await expect(navigation.getProps(parent.id, 'default', resolved)).resolves.toEqual({ kind: 'value', value: { value: 'first' } })
  navigation.stop()
})

test('a staged callback reads named data from its computation store', async () => {
  const route = createRoute({ path: '/' })
    .addLoader(() => 'named', { name: 'user' })
    .addView(Page, { props: async (route) => ({ value: await route.getData('user') }) })
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()

  await Promise.all(navigation.staged().compute(resolved, getComputations(resolved)))
  navigation.commit({ to: resolved, from: null })

  expect(navigation.getProps(route.id, 'default', resolved)).toEqual({ kind: 'value', value: { value: 'named' } })
  navigation.stop()
})

test('a loader cannot read its own route with getData()', async () => {
  const route = createRoute({ path: '/' }).addLoader((route) => {
    expect(() => Reflect.get(route, 'getData')()).toThrow(LoaderDataAccessError)
    return 'loaded'
  })
    .addView(Page, { props: async (route) => ({ value: await route.getData() }) })
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()

  navigation.commit({ to: resolved, from: null })

  await expect(navigation.getProps(route.id, 'default', resolved)).resolves.toEqual({ kind: 'value', value: { value: 'loaded' } })
  navigation.stop()
})

test('getData() preserves a loader rejection', async () => {
  const error = new Error('loader failed')
  const route = createRoute({ path: '/' }).addLoader((): string => {
    throw error
  })
    .addView(Page, { props: async (route) => ({ value: await route.getData() }) })
  const resolved = createResolvedRoute(route)
  const navigation = createRouterNavigation()

  navigation.commit({ to: resolved, from: null })

  await expect(navigation.getProps(route.id, 'default', resolved)).resolves.toEqual({ kind: 'error', error })
  navigation.stop()
})
