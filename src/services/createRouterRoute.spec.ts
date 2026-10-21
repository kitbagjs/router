import { expect, test, vi } from 'vitest'
import { computed, toRefs } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { createRouterRoute, isRouterRoute } from '@/services/createRouterRoute'
import { createRoute } from './createRoute'
import { createResolvedRoute } from './createResolvedRoute'
import { createRouter } from './createRouter'
import { component } from '@/utilities/testHelpers'
import { isResolvedRoute, ResolvedRoute } from '@/types/resolved'
import { createRouteValueStore } from './createRouteValueStore'
import { NavigationAbandonedError } from '@/errors/navigationAbandonedError'

test('router route does not retain the initial resolved route internals', () => {
  const initial = createResolvedRoute(createRoute({ name: 'initial' }))
  const next = createResolvedRoute(createRoute({ name: 'next' }))
  const routerKey = Symbol()
  const routerRoute = createRouterRoute({ routerKey, route: initial, push: vi.fn(), getData: () => undefined })

  for (const route of [initial, next]) {
    routerRoute.updateRoute(route)

    expect(isRouterRoute(routerKey, routerRoute)).toBe(true)
    expect(isResolvedRoute(routerRoute)).toBe(false)
    expect(routerRoute).not.toHaveProperty('hooks')
    expect(routerRoute).not.toHaveProperty('getRouteTitle')
    expect(routerRoute.getResolvedRoute()).toBe(route)
  }
})

test('updateRoute updates the derived fields and the current resolved route', () => {
  const initial = createResolvedRoute(createRoute({ name: 'initial', path: '/initial/[id]' }), { id: '1' }, { query: { page: '1' } })
  const next = createResolvedRoute(createRoute({ name: 'next', path: '/next/[id]' }), { id: '2' }, { query: { page: '2' }, hash: 'details' })
  const routerRoute = createRouterRoute({ routerKey: Symbol(), route: initial, push: vi.fn(), getData: () => undefined })

  expect(routerRoute.name).toBe('initial')
  expect({ ...routerRoute.params }).toEqual({ id: '1' })
  expect(routerRoute.query.get('page')).toBe('1')
  expect(routerRoute.href).toBe(initial.href)
  expect(routerRoute.getResolvedRoute()).toBe(initial)

  routerRoute.updateRoute(next)

  expect(routerRoute.name).toBe('next')
  expect({ ...routerRoute.params }).toEqual({ id: '2' })
  expect(routerRoute.query.get('page')).toBe('2')
  expect(routerRoute.href).toBe(next.href)
  expect(routerRoute.hash).toBe(next.hash)
  expect(routerRoute.id).toBe(next.id)
  expect(routerRoute.matched).toEqual(next.matched)
  expect(routerRoute.matches).toEqual(next.matches)
  expect(routerRoute.getResolvedRoute()).toBe(next)
})

test('data is refreshed from getData when the resolved route changes', async () => {
  const initial = createResolvedRoute(createRoute({ name: 'initial' }))
  const next = createResolvedRoute(createRoute({ name: 'next' }))
  const getData = vi.fn((route: ResolvedRoute) => Promise.resolve(route.name))
  const routerRoute = createRouterRoute({ routerKey: Symbol(), route: initial, push: vi.fn(), getData })

  await expect(routerRoute.data).resolves.toBe('initial')
  expect(getData).toHaveBeenLastCalledWith(initial)

  routerRoute.updateRoute(next)

  await expect(routerRoute.data).resolves.toBe('next')
  expect(getData).toHaveBeenLastCalledWith(next)
})

test.each([
  { named: false, pending: false },
  { named: true, pending: false },
  { named: false, pending: true },
  { named: true, pending: true },
])('data follows a replaced store when reusing the resolved route (named: $named, pending: $pending)', async ({ named, pending }) => {
  const first = Promise.withResolvers<string>()
  const second = Promise.withResolvers<string>()
  const load = vi.fn()
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise)
  const route = createResolvedRoute(createRoute({ name: 'route', path: '/' }).addLoader(load, named ? { name: 'value' } : undefined))
  const store = createRouteValueStore()
  const routerRoute = createRouterRoute({ routerKey: Symbol(), route, push: vi.fn(), getData: store.getData })
  const readData = (): Promise<unknown> => {
    return named
      ? (routerRoute.data as Record<string, Promise<unknown>>).value
      : routerRoute.data as Promise<unknown>
  }

  const firstCommit = store.commit(route)
  const previous = readData()

  if (!pending) {
    first.resolve('first')
    await firstCommit.loaders
    await expect(previous).resolves.toBe('first')
  }

  const secondCommit = store.commit(route)
  routerRoute.updateRoute(route)
  const current = readData()

  expect(current).not.toBe(previous)
  second.resolve('second')
  await secondCommit.loaders
  await expect(current).resolves.toBe('second')

  if (pending) {
    await expect(previous).rejects.toBeInstanceOf(NavigationAbandonedError)
    first.resolve('late')
    await firstCommit.loaders
    await expect(readData()).resolves.toBe('second')
  }
})

test('isRouterRoute returns correct response', () => {
  const route = createRoute({ name: 'isRouterRoute' })
  const resolved = createResolvedRoute(route, {})
  const push = vi.fn()
  const routerKey = Symbol()

  const routerRoute = createRouterRoute({
    routerKey,
    route: resolved,
    push,
    getData: () => undefined,
  })

  expect(isRouterRoute(routerKey, routerRoute)).toBe(true)
  expect(isRouterRoute(routerKey, {})).toBe(false)
})

test('sending state, includes state in push options', () => {
  const route = createRoute({ name: 'state' })
  const resolved = createResolvedRoute(route, {})
  const push = vi.fn()
  const routerKey = Symbol()

  const routerRoute = createRouterRoute({
    routerKey,
    route: resolved,
    push,
    getData: () => undefined,
  })

  routerRoute.update({}, { state: { foo: 'foo' } })

  expect(push).toHaveBeenCalledWith(
    'state',
    {},
    { state: { foo: 'foo' } },
  )

  routerRoute.update('param', 123, { state: { bar: 'bar' } })

  expect(push).toHaveBeenCalledWith(
    'state',
    { param: 123 },
    { state: { bar: 'bar' } },
  )
})

test('getTitle resolves the title of the current route', async () => {
  const home = createRoute({ name: 'home', path: '/' }).addView(component)
  const other = createRoute({ name: 'other', path: '/other' }).addView(component)

  home.setTitle(() => 'Home')
  other.setTitle(() => 'Other')

  const router = createRouter([home, other], { initialUrl: '/' })

  await router.start()

  await expect(router.route.getTitle()).resolves.toBe('Home')

  await router.push('other')

  await expect(router.route.getTitle()).resolves.toBe('Other')
})

test('params work with toRefs across navigation without warnings', async () => {
  const home = createRoute({ name: 'home', path: '/[id]' })
  const router = createRouter([home], { initialUrl: '/one' })

  await router.start()

  const params = router.route.params
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  try {
    const { id } = toRefs(params)
    const currentId = computed(() => id.value)

    expect(warn).not.toHaveBeenCalled()
    expect(currentId.value).toBe('one')

    await router.push('home', { id: 'two' })

    expect(router.route.params).toBe(params)
    expect(currentId.value).toBe('two')

    id.value = 'three'
    await flushPromises()

    expect(currentId.value).toBe('three')
    expect(router.route.href).toBe('/three')
    expect(warn).not.toHaveBeenCalled()
  } finally {
    router.stop()
    warn.mockRestore()
  }
})

test('canonical follows the current route', async () => {
  const user = createRoute({ name: 'user', path: '/user/[id]' }).addView(component)
    .addAlias({ path: '/member/[id]' })
  const router = createRouter([user], { initialUrl: '/member/1' })

  await router.start()

  expect(router.route.canonical).toBe('/user/1')

  await router.push('/member/2')

  expect(router.route.canonical).toBe('/user/2')
})
