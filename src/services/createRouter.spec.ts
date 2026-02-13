import { flushPromises } from '@vue/test-utils'
import { Location } from 'history'
import { describe, expect, test, vi } from 'vitest'
import { computed, toRefs } from 'vue'
import { DuplicateNamesError } from '@/errors/duplicateNamesError'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import * as createRouterHistoryUtilities from '@/services/createRouterHistory'
import { component, routes } from '@/utilities/testHelpers'
import { createExternalRoute } from '@/services/createExternalRoute'
import { RouteNotFoundError } from '@/errors/routeNotFoundError'
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'

test('initial route is set', async () => {
  const foo = createRoute({
    name: 'root',
    component,
    path: '/',
  })

  const { route, start } = createRouter([foo], {
    initialUrl: '/',
  })

  await start()

  expect(route.matched.name).toBe('root')
})

test('initial state is set', async () => {
  const location: Location = {
    key: 'foo',
    pathname: '/',
    search: '',
    hash: '',
    state: { zoo: '123' },
  }

  const actual = createRouterHistoryUtilities.createRouterHistory({ listener: () => {} })
  vi.spyOn(createRouterHistoryUtilities, 'createRouterHistory').mockImplementation(() => ({
    ...actual,
    location,
  }))

  const foo = createRoute({
    name: 'root',
    component,
    path: '/',
    state: { zoo: Number },
  })

  const { route, start } = createRouter([foo], {
    initialUrl: '/',
  })

  await start()

  expect(route.state).toMatchObject({ zoo: 123 })
})

test('updates the route when navigating', async () => {
  const theRoute = createRoute({
    name: 'first',
    component,
    path: '/first',
  })

  const routes = [
    theRoute,
    createRoute({
      name: 'second',
      component,
      path: '/second',
    }),
    createRoute({
      name: 'third',
      component,
      path: '/third/[id]',
    }),
  ]

  const { push, route, start } = createRouter(routes, {
    initialUrl: '/first',
  })

  await start()

  await push('first', {}, { state: { foo: 123 } })

  expect(route.matched.name).toBe('first')

  await push('/second')

  expect(route.matched.name).toBe('second')
})

test('route update updates the current route', async () => {
  const route = createRoute(
    {
      name: 'root',
      component,
      path: '/[param]',
    })

  const router = createRouter([route], {
    initialUrl: '/one',
  })

  await router.start()

  await router.route.update('param', 'two')

  expect(router.route.params.param).toBe('two')

  await router.route.update({
    param: 'three',
  })

  expect(router.route.params.param).toBe('three')
})

test.fails('route is readonly except for individual params', async () => {
  const routes = [
    createRoute({
      name: 'root',
      component,
      path: '/',
    }),
  ]

  const { route, start } = createRouter(routes, {
    initialUrl: '/',
  })

  await start()

  // @ts-expect-error value is immutable
  route.name = 'child'
  expect(route.name).toBe('root')

  // @ts-expect-error value is immutable
  route.matched = 'match'
  expect(route.matched).toMatchObject(routes[0].matched)

  // @ts-expect-error value is immutable
  route.matches = 'matches'
  expect(route.matches).toMatchObject(routes[0].matches)

  route.params = { foo: 'bar' }
  expect(route.params).toMatchObject({})
})

test('individual params are writable', async () => {
  const routes = [
    createRoute({
      name: 'root',
      component,
      path: '/[param]',
    }),
  ]

  const { route, start } = createRouter(routes, {
    initialUrl: '/one',
  })

  await start()

  route.params.param = 'goodbye'

  await flushPromises()

  expect(route.params.param).toBe('goodbye')

  const { param } = toRefs(route.params)

  param.value = 'again'

  await flushPromises()

  expect(route.params.param).toBe('again')

  // @ts-expect-error value is immutable
  route.params.nothing = 'nothing'

  await flushPromises()

  // @ts-expect-error value is immutable
  expect(route.params.nothing).toBeUndefined()
})

test('individual params are writable when using toRefs', async () => {
  const routes = [
    createRoute({
      name: 'root',
      component,
      path: '/[param]',
    }),
  ]

  const { route, start } = createRouter(routes, {
    initialUrl: '/one',
  })

  await start()

  const { param } = toRefs(route.params)

  param.value = 'two'

  await flushPromises()

  expect(route.params.param).toBe('two')
})

test('setting an unknown param does not add its value to the route', async () => {
  const routes = [
    createRoute({
      name: 'root',
      component,
      path: '/',
    }),
  ]
  const { route, start } = createRouter(routes, {
    initialUrl: '/',
  })

  await start()

  // @ts-expect-error value is immutable
  route.params.nothing = 'nothing'

  await flushPromises()

  // @ts-expect-error value is immutable
  expect(route.params.nothing).toBeUndefined()
})

test('params are writable', async () => {
  const routes = [
    createRoute({
      name: 'root',
      component,
      path: '/[paramA]/[paramB]/[?paramC]',
    }),
  ]

  const { route, start } = createRouter(routes, {
    initialUrl: '/one/two/three',
  })

  await start()

  expect(route.params).toMatchObject({
    paramA: 'one',
    paramB: 'two',
    paramC: 'three',
  })

  route.params = {
    paramA: 'four',
    paramB: 'five',
  }

  await flushPromises()

  expect(route.params).toMatchObject({
    paramA: 'four',
    paramB: 'five',
  })

  const { params } = toRefs(route)

  params.value = {
    paramA: 'six',
    paramB: 'seven',
  }

  await flushPromises()

  expect(route.params).toMatchObject({
    paramA: 'six',
    paramB: 'seven',
  })
})

test('params can be destructured', async () => {
  const root = createRoute({
    name: 'root',
    component,
    path: '/[paramA]/[paramB]',
  })

  const { route, start, push } = createRouter([root], {
    initialUrl: '/one/two',
  })

  await start()

  const { paramA, paramB } = toRefs(route.params)

  expect(paramA.value).toBe('one')
  expect(paramB.value).toBe('two')

  await push('root', { paramA: 'three', paramB: 'four' })

  expect(paramA.value).toBe('three')
  expect(paramB.value).toBe('four')

  paramA.value = 'five'

  await flushPromises()

  expect(route.params.paramA).toBe('five')
})

test('query is writable', async () => {
  const root = createRoute({
    name: 'root',
    component,
    path: '/',
  })

  const { route, start } = createRouter([root], {
    initialUrl: '/?foo=bar&fiz=buz',
  })

  await start()

  route.query = 'foo=bar&foo=baz'

  await flushPromises()

  expect(route.query.toString()).toBe('foo=bar&foo=baz')

  const { query } = toRefs(route)

  // @ts-expect-error vue's `reactive` utility loses the type information for computed setters but we do expect this to work
  query.value = 'foo2=bar2&foo2=baz2'

  await flushPromises()

  expect(route.query.toString()).toBe('foo2=bar2&foo2=baz2')
})

test('query.set updates the route', async () => {
  const root = createRoute({
    name: 'root',
    component,
    path: '/',
  })

  const { route, start } = createRouter([root], {
    initialUrl: '/',
  })

  await start()

  route.query.set('foo', 'bar')

  await flushPromises()

  expect(route.query.toString()).toBe('foo=bar')

  route.query.set('fuz', 'buz')

  await flushPromises()

  expect(route.query.toString()).toBe('foo=bar&fuz=buz')
})

test('query.append updates the route', async () => {
  const root = createRoute({
    name: 'root',
    component,
    path: '/',
  })

  const { route, start } = createRouter([root], {
    initialUrl: '/',
  })

  await start()

  route.query.append('foo', 'bar')

  await flushPromises()

  expect(route.query.toString()).toBe('foo=bar')

  route.query.append('fuz', 'buz')

  await flushPromises()

  expect(route.query.toString()).toBe('foo=bar&fuz=buz')
})

test('query.delete updates the route', async () => {
  const root = createRoute({
    name: 'root',
    component,
    path: '/',
  })

  const { route, start } = createRouter([root], {
    initialUrl: '/?foo=bar&fiz=buz',
  })

  await start()

  route.query.delete('foo')

  await flushPromises()

  expect(route.query.toString()).toBe('fiz=buz')
})

test('query.values is reactive', async () => {
  const root = createRoute({
    name: 'root',
    component,
    path: '/',
  })

  const { route, start } = createRouter([root], {
    initialUrl: '/?foo=foo1&bar=bar1',
  })

  await start()

  const values = computed(() => Array.from(route.query.values()))

  expect(values.value).toMatchObject(['foo1', 'bar1'])

  route.query.append('foo', 'foo2')

  await flushPromises()

  expect(values.value).toMatchObject(['foo1', 'bar1', 'foo2'])
})

test('given an array of Routes with duplicate names, throws DuplicateNamesError', () => {
  const aRoutes = [
    createRoute({ name: 'foo', component }),
    createRoute({ name: 'bar', component }),
  ]
  const bRoutes = [
    createRoute({ name: 'zoo', component }),
    createRoute({ name: 'bar', component }),
  ]

  const action: () => void = () => createRouter([aRoutes, bRoutes], {
    initialUrl: '/',
  })

  expect(action).toThrow(DuplicateNamesError)
})

test('given an array of Routes with missing context, can still match missing routes', async () => {
  const missingRoute = createRoute({ name: 'missing', path: '/missing', component })

  const router = createRouter([
    createRoute({ name: 'foo', path: '/foo', component, context: [missingRoute] }),
    createRoute({ name: 'bar', path: '/bar', component }),
  ], {
    initialUrl: '/missing',
  })

  await router.start()

  expect(router.route.name).toBe('missing')
})

test('given an array of Routes with missing context with duplicate route names, throws DuplicateNamesError', async () => {
  const missingRoute = createRoute({ name: 'foo', component })

  const action: () => void = () => createRouter([
    createRoute({ name: 'foo', component, context: [missingRoute] }),
  ], {
    initialUrl: '/missing',
  })

  expect(action).toThrow(DuplicateNamesError)
})

test('initial route is not set until the router is started', async () => {
  const route = createRoute({
    name: 'root',
    path: '/',
    component,
  })

  const router = createRouter([route], {
    initialUrl: '/',
  })

  expect(router.route.name).toBe('NotFound')

  await router.start()

  expect(router.route.name).toBe('root')
})

describe('router.resolve', () => {
  test('when given a name that matches a route return that route', () => {
    const router = createRouter(routes, { initialUrl: '/' })

    const route = router.resolve('parentB')

    expect(route).toBeDefined()
    expect(route.name).toBe('parentB')
  })

  test('when given a name that does not match a route throws RouteNotFoundError', () => {
    const router = createRouter(routes, { initialUrl: '/' })

    const action: () => void = () => router.resolve('parentD' as any)

    expect(action).toThrow(RouteNotFoundError)
  })

  test('given a route name with params, interpolates param values', () => {
    const router = createRouter(routes, { initialUrl: '/' })
    const route = router.resolve('parentA', { paramA: 'bar' })

    expect(route).toMatchObject({
      name: 'parentA',
      params: {
        paramA: 'bar',
      },
      href: '/parentA/bar',
    })
  })

  test('given a route name with query, interpolates param values', () => {
    const router = createRouter(routes, { initialUrl: '/' })
    const route = router.resolve('parentA', { paramA: 'bar' }, { query: { foo: 'foo' } })

    expect(route).toMatchObject({
      name: 'parentA',
      params: {
        paramA: 'bar',
      },
      href: '/parentA/bar?foo=foo',
    })
  })

  test('given a route name with params cannot be matched, throws InvalidRouteParamValueError', () => {
    const router = createRouter(routes, { initialUrl: '/' })

    const action: () => void = () => router.resolve('parentA', { missing: 'foo' } as any)

    expect(action).toThrow(InvalidRouteParamValueError)
  })

  test('given a param with a dash or underscore resolves the correct url', () => {
    const routes = [
      createRoute({
        name: 'kebab',
        path: '/[test-param]',
        component,
      }),
      createRoute({
        name: 'snake',
        path: '/[test_param]',
        component,
      }),
    ]

    const router = createRouter(routes, { initialUrl: '/' })

    const kebab = router.resolve('kebab', { 'test-param': 'foo' })

    expect(kebab).toMatchObject({
      name: 'kebab',
      params: {
        'test-param': 'foo',
      },
      href: '/foo',
    })

    const snake = router.resolve('snake', { test_param: 'foo' })

    expect(snake).toMatchObject({
      name: 'snake',
      params: {
        test_param: 'foo',
      },
      href: '/foo',
    })
  })

  test('when given an external route returns a fully qualified url', () => {
    const routes = [createExternalRoute({
      host: 'https://kitbag.dev',
      name: 'external',
      path: '/',
    })]

    const router = createRouter(routes, { initialUrl: '/' })

    const route = router.resolve('external')

    expect(route).toMatchObject({
      name: 'external',
      href: 'https://kitbag.dev/',
    })
  })

  test('when given an external route with params in host, interpolates param values', () => {
    const routes = [createExternalRoute({
      host: 'https://[subdomain].kitbag.dev',
      name: 'external',
      path: '/',
    })]

    const router = createRouter(routes, { initialUrl: '/' })

    const route = router.resolve('external', { subdomain: 'router' })

    expect(route).toMatchObject({
      name: 'external',
      href: 'https://router.kitbag.dev/',
    })
  })

  test('given a route with hash, interpolates hash value', () => {
    const router = createRouter(routes, { initialUrl: '/' })

    const route = router.resolve('parentA', { paramA: 'bar' }, { hash: 'foo' })

    expect(route).toMatchObject({
      name: 'parentA',
      params: {
        paramA: 'bar',
      },
      hash: '#foo',
      href: '/parentA/bar#foo',
    })
  })
})

describe('router.push', () => {
  test('given a resolved route, pushes the route', async () => {
    const router = createRouter(routes, { initialUrl: '/' })
    const route = router.resolve('parentA', { paramA: 'bar' })

    await router.push(route)

    expect(router.route.href).toBe('/parentA/bar')
  })

  test('given a route name, pushes the route', async () => {
    const router = createRouter(routes, { initialUrl: '/' })

    await router.push('parentA', { paramA: 'bar' })

    expect(router.route.href).toBe('/parentA/bar')
  })

  test('given an internal Url, pushes the route', async () => {
    const router = createRouter(routes, { initialUrl: '/' })

    await router.push('/parentA/bar')

    expect(router.route).toMatchObject({
      name: 'parentA',
      params: {
        paramA: 'bar',
      },
    })
  })

  test('given a resolved route with state inside, pushes state', async () => {
    const routeWithState = createRoute({
      name: 'route-with-state',
      component,
      path: '/route-with-state',
      state: { zoo: Number },
    })
    const router = createRouter([routeWithState], { initialUrl: '/' })
    const route = router.resolve('route-with-state', { paramA: 'bar' }, { state: { zoo: 123 } })

    await router.push(route)

    expect(router.route.state).toMatchObject({ zoo: 123 })
  })

  test('given a resolved route with state in options, pushes state', async () => {
    const routeWithState = createRoute({
      name: 'route-with-state',
      component,
      path: '/route-with-state',
      state: { zoo: Number },
    })
    const router = createRouter([routeWithState], { initialUrl: '/' })
    const route = router.resolve('route-with-state', { paramA: 'bar' })

    await router.push(route, { state: { zoo: 123 } })

    expect(router.route.state).toMatchObject({ zoo: 123 })
  })

  test('given a route name with state in options, pushes state', async () => {
    const routeWithState = createRoute({
      name: 'route-with-state',
      component,
      path: '/route-with-state',
      state: { zoo: Number },
    })
    const router = createRouter([routeWithState], { initialUrl: '/' })

    await router.push('route-with-state', { paramA: 'bar' }, { state: { zoo: 123 } })

    expect(router.route.state).toMatchObject({ zoo: 123 })
  })

  test('given an internal Url with state in options, pushes state', async () => {
    const routeWithState = createRoute({
      name: 'route-with-state',
      component,
      path: '/route-with-state',
      state: { zoo: Number },
    })
    const router = createRouter([routeWithState], { initialUrl: '/' })

    await router.push('/route-with-state', { state: { zoo: 123 } })

    expect(router.route.state).toMatchObject({ zoo: 123 })
  })
})

describe('router.onError', () => {
  test.each([
    { hook: 'onBeforeRouteEnter' },
    { hook: 'onAfterRouteEnter' },
  ] as const)('given an error thrown in $hook, calls the onError callback with the correct context', async ({ hook }) => {
    const error = new Error('Test error')
    const onError = vi.fn()

    const route = createRoute({
      name: 'route-with-error',
      component,
      path: '/',
    })

    const router = createRouter([route], { initialUrl: '/' })

    router[hook](() => {
      throw error
    })

    router.onError(onError)

    await router.push('route-with-error')

    expect(onError).toHaveBeenCalledWith(error, expect.objectContaining({
      source: 'hook',
    }))
  })

  test.each([
    { hook: 'onBeforeRouteUpdate' },
    { hook: 'onAfterRouteUpdate' },
  ] as const)('given an error thrown in $hook, calls the onError callback with the correct context', async ({ hook }) => {
    const error = new Error('Test error')
    const onError = vi.fn()

    const route = createRoute({
      name: 'route-with-error',
      component,
      path: '/[param]',
    })

    const router = createRouter([route], { initialUrl: '/' })
    await router.start()

    router[hook](() => {
      throw error
    })

    router.onError(onError)

    // Navigate to the route first
    await router.push('route-with-error', { param: 'bar' })
    // Then navigate to the same route again to trigger update
    await router.push('route-with-error', { param: 'foo' })

    expect(onError).toHaveBeenCalledWith(error, expect.objectContaining({
      source: 'hook',
    }))
  })

  test.each([
    { hook: 'onBeforeRouteLeave' },
    { hook: 'onAfterRouteLeave' },
  ] as const)('given an error thrown in $hook, calls the onError callback with the correct context', async ({ hook }) => {
    const error = new Error('Test error')
    const onError = vi.fn()

    const route1 = createRoute({
      name: 'route-1',
      component,
      path: '/route-1',
    })

    const route2 = createRoute({
      name: 'route-2',
      component,
      path: '/route-2',
    })

    const router = createRouter([route1, route2], { initialUrl: '/' })
    await router.start()

    router[hook](() => {
      throw error
    })

    router.onError(onError)

    // Navigate to route-1 first
    await router.push('route-1')
    // Then navigate to route-2 to trigger leave
    await router.push('route-2')

    expect(onError).toHaveBeenCalledWith(error, expect.objectContaining({
      source: 'hook',
    }))
  })

  test('given an error thrown in a props callback, calls the onError callback with the correct context', async () => {
    const error = new Error('Test error')
    const onError = vi.fn()

    const routeWithError = createRoute({
      name: 'route-with-error',
      component,
      path: '/route-with-error',
    }, () => {
      throw error
    })

    const router = createRouter([routeWithError], { initialUrl: '/' })
    await router.start()

    router.onError(onError)

    await router.push('route-with-error')
    await flushPromises()

    expect(onError).toHaveBeenCalledWith(error, expect.objectContaining({
      source: 'props',
    }))
  })
})

describe('options.removeTrailingSlashes', () => {
  const foo = createRoute({
    name: 'foo',
    component,
    path: '/foo',
  })

  const fooWithTrailingSlash = createRoute({
    name: 'fooWithTrailingSlash',
    component,
    path: '/foo/',
  })

  const bar = createRoute({
    name: 'bar',
    component,
    path: '/bar',
  })

  test('when true, removes trailing slashes from the path', async () => {
    const router = createRouter([foo, fooWithTrailingSlash, bar], {
      initialUrl: '/foo/',
      removeTrailingSlashes: true,
    })

    await router.start()

    // trims the trailing slash from the initial url
    expect(router.route.href).toBe('/foo')

    await router.push('/bar/')

    // trims the trailing slash from the path
    expect(router.route.href).toBe('/bar')

    await router.push('fooWithTrailingSlash')

    // trims the trailing slash from the path
    expect(router.route.href).toBe('/foo')
  })

  test('when false, does not remove trailing slashes from the path', async () => {
    const router = createRouter([foo, fooWithTrailingSlash, bar], {
      initialUrl: '/foo/',
      removeTrailingSlashes: false,
    })

    await router.start()

    expect(router.route.href).toBe('/foo/')

    await router.push('fooWithTrailingSlash')

    expect(router.route.href).toBe('/foo/')

    await router.push('/bar/')

    // rejects so has an empty path
    expect(router.route.href).toBe('/')
  })
})
