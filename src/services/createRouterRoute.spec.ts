import { expect, test, vi } from 'vitest'
import { computed, toRefs } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { createRouterRoute, isRouterRoute } from '@/services/createRouterRoute'
import { createRoute } from './createRoute'
import { createResolvedRoute } from './createResolvedRoute'
import { createRouter } from './createRouter'
import { component } from '@/utilities/testHelpers'
import { isResolvedRoute, ResolvedRoute } from '@/types/resolved'
import { createRouterNavigation } from './createRouterNavigation'
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
])('data follows a replaced navigation when reusing the resolved route (named: $named, pending: $pending)', async ({ named, pending }) => {
  const first = Promise.withResolvers<string>()
  const second = Promise.withResolvers<string>()
  const load = vi.fn()
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise)
  const route = createResolvedRoute(createRoute({ name: 'route', path: '/' }).addLoader(load, named ? { name: 'value' } : undefined))
  const navigation = createRouterNavigation()
  const routerRoute = createRouterRoute({ routerKey: Symbol(), route, push: vi.fn(), getData: navigation.getData })
  const readData = (): Promise<unknown> => {
    return named
      ? (routerRoute.data as Record<string, Promise<unknown>>).value
      : routerRoute.data as Promise<unknown>
  }

  const firstCommit = navigation.commit(route)
  const previous = readData()

  if (!pending) {
    first.resolve('first')
    await Promise.allSettled(firstCommit)
    await expect(previous).resolves.toBe('first')
  }

  const secondCommit = navigation.commit(route)
  routerRoute.updateRoute(route)
  const current = readData()

  expect(current).not.toBe(previous)
  second.resolve('second')
  await Promise.all(secondCommit)
  await expect(current).resolves.toBe('second')

  if (pending) {
    await expect(previous).rejects.toBeInstanceOf(NavigationAbandonedError)
    first.resolve('late')
    await Promise.allSettled(firstCommit)
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

test('retained state refs follow navigation and update the current state without warnings', async () => {
  const home = createRoute({ name: 'home', path: '/', state: { value: String, previous: String } })
  const other = createRoute({ name: 'other', path: '/other', state: { value: String, current: String } })
  const router = createRouter([home, other], { initialUrl: '/' })

  await router.start()
  await router.push('home', {}, { state: { value: 'one', previous: 'old' } })

  const state = router.route.state
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

  try {
    const { value } = toRefs(state)
    const currentValue = computed(() => value.value)

    expect(currentValue.value).toBe('one')
    expect(warn).not.toHaveBeenCalled()

    await router.push('other', {}, { state: { value: 'two', current: 'new' } })

    expect(router.route.state).toBe(state)
    expect(currentValue.value).toBe('two')
    expect({ ...state }).toEqual({ value: 'two', current: 'new' })
    expect('previous' in state).toBe(false)
    expect('current' in state).toBe(true)

    value.value = 'three'
    await flushPromises()

    expect(currentValue.value).toBe('three')
    expect(router.route.state).toEqual({ value: 'three', current: 'new' })

    router.route.state = { value: 'four', current: 'replaced' }
    await flushPromises()

    expect(currentValue.value).toBe('four')
    expect({ ...state }).toEqual({ value: 'four', current: 'replaced' })
    expect(warn).not.toHaveBeenCalled()
  } finally {
    router.stop()
    warn.mockRestore()
  }
})

test('retained query and reader methods follow navigation', async () => {
  const home = createRoute({ name: 'home', path: '/' })
  const router = createRouter([home], { initialUrl: '/?value=one' })

  await router.start()

  const query = router.route.query
  const get = query.get
  const value = computed(() => get('value'))
  const size = computed(() => query.size)

  try {
    expect(value.value).toBe('one')
    expect(size.value).toBe(1)

    await router.push('/?value=two&value=three&extra=new')

    expect(router.route.query).toBe(query)
    expect(value.value).toBe('two')
    expect(size.value).toBe(3)
    expect(query.getAll('value')).toEqual(['two', 'three'])
    expect(query.has('extra')).toBe(true)
    expect([...query]).toEqual([['value', 'two'], ['value', 'three'], ['extra', 'new']])
    expect(new URLSearchParams(query).toString()).toBe('value=two&value=three&extra=new')

    router.route.query = 'value=four'
    await flushPromises()

    expect(value.value).toBe('four')
    expect(size.value).toBe(1)
    expect(query.has('extra')).toBe(false)
  } finally {
    router.stop()
  }
})

test.each([
  { method: 'set', mutate: (query: URLSearchParams) => query.set('value', 'three'), expected: 'value=three&extra=new' },
  { method: 'append', mutate: (query: URLSearchParams) => query.append('value', 'three'), expected: 'value=two&extra=new&value=three' },
  { method: 'delete', mutate: (query: URLSearchParams) => query.delete('value'), expected: 'extra=new' },
  { method: 'sort', mutate: (query: URLSearchParams) => query.sort(), expected: 'extra=new&value=two' },
])('retained query.$method navigates with the current query values', async ({ mutate, expected }) => {
  const home = createRoute({ name: 'home', path: '/' })
  const router = createRouter([home], { initialUrl: '/?value=one' })

  await router.start()

  const query = router.route.query

  try {
    await router.push('/?value=two&extra=new')

    mutate(query)
    await flushPromises()

    expect(router.route.href).toBe(`/?${expected}`)
    expect(query.toString()).toBe(expected)
  } finally {
    router.stop()
  }
})
