import { flushPromises } from '@vue/test-utils'
import { Location } from '@/services/history'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { computed, createApp, toRefs } from 'vue'
import { createUseRouterNavigation } from '@/compositions/useRouterNavigation'
import { getComputations } from '@/services/getComputations'
import { DuplicateNamesError } from '@/errors/duplicateNamesError'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import * as createRouterHistoryUtilities from '@/services/createRouterHistory'
import { component, routes } from '@/utilities/testHelpers'
import { createExternalRoute } from '@/services/createExternalRoute'
import { RouteNotFoundError } from '@/errors/routeNotFoundError'
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'
import { createRejection } from './createRejection'
import { SsrOptionRequiredError } from '@/errors/ssrOptionRequiredError'
import { PayloadValueError } from '@/errors/payloadValueError'
import { RouterPushOptionsInternal } from '@/types/routerNavigationInternal'
import { RenderRedirect, RenderSuccess, ServerRenderResponse } from '@/types/router'

test('initial route is set', async () => {
  const foo = createRoute({ name: 'root', path: '/' }).addView(component)

  const { route, start } = createRouter([foo], {
    initialUrl: '/',
  })

  await start()

  expect(route.matched.name).toBe('root')
})

test('stopping the router aborts its loaders', async () => {
  const pending = Promise.withResolvers<string>()
  const signals: AbortSignal[] = []
  const route = createRoute({ name: 'home', path: '/' })
    .addLoader((_route, { signal }) => {
      signals.push(signal)
      return pending.promise
    })
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()

  router.stop()

  expect(signals[0].aborted).toBe(true)
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

  const foo = createRoute({ name: 'root', path: '/', state: { zoo: Number } }).addView(component)

  const { route, start } = createRouter([foo], {
    initialUrl: '/',
  })

  await start()

  expect(route.state).toMatchObject({ zoo: 123 })

  vi.restoreAllMocks()
})

test('updates the route when navigating', async () => {
  const theRoute = createRoute({ name: 'first', path: '/first' }).addView(component)

  const routes = [
    theRoute,
    createRoute({ name: 'second', path: '/second' }).addView(component),
    createRoute({ name: 'third', path: '/third/[id]' }).addView(component),
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
  const route = createRoute({ name: 'root', path: '/[param]' }).addView(component)

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

test.each(['name', 'matched', 'matches'] as const)('route.%s is readonly', async (property) => {
  const routes = [
    createRoute({ name: 'root', path: '/' }).addView(component),
  ]

  const { route, start } = createRouter(routes, {
    initialUrl: '/',
  })

  await start()

  const original = route[property]

  expect(() => {
    // @ts-expect-error value is immutable
    route[property] = 'changed'
  }).toThrow(TypeError)

  expect(route[property]).toBe(original)
})

test('individual params are writable', async () => {
  const routes = [
    createRoute({ name: 'root', path: '/[param]' }).addView(component),
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
    createRoute({ name: 'root', path: '/[param]' }).addView(component),
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
    createRoute({ name: 'root', path: '/' }).addView(component),
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
    createRoute({ name: 'root', path: '/[paramA]/[paramB]/[?paramC]' }).addView(component),
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
  const root = createRoute({ name: 'root', path: '/[paramA]/[paramB]' }).addView(component)

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
  const root = createRoute({ name: 'root', path: '/' }).addView(component)

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
  const root = createRoute({ name: 'root', path: '/' }).addView(component)

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

test('query.set does not duplicate existing params when updating one param', async () => {
  const root = createRoute({ name: 'root', path: '/', query: 'param=[param]' }).addView(component)

  const { route, start } = createRouter([root], {
    initialUrl: '/?param=value&foo=1',
  })

  await start()

  expect(route.query.toString()).toBe('param=value&foo=1')

  route.query.set('foo', '2')

  await flushPromises()

  expect(route.query.toString()).toBe('param=value&foo=2')
})

test('query.set can change the value of a param that is already set', async () => {
  const root = createRoute({ name: 'root', query: 'param=[param]', path: '/' }).addView(component)

  const { route, start } = createRouter([root], {
    initialUrl: '/?param=foo&notAParam=1',
  })

  await start()

  route.query.set('param', 'bar')

  await flushPromises()

  expect(route.query.toString()).toBe('param=bar&notAParam=1')
})

test('query.append updates the route', async () => {
  const root = createRoute({ name: 'root', path: '/' }).addView(component)

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
  const root = createRoute({ name: 'root', path: '/' }).addView(component)

  const { route, start } = createRouter([root], {
    initialUrl: '/?foo=bar&fiz=buz',
  })

  await start()

  route.query.delete('foo')

  await flushPromises()

  expect(route.query.toString()).toBe('fiz=buz')
})

test('query.values is reactive', async () => {
  const root = createRoute({ name: 'root', path: '/' }).addView(component)

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
    createRoute({ name: 'foo', path: '/foo' }).addView(component),
    createRoute({ name: 'bar', path: '/bar' }).addView(component),
  ]
  const bRoutes = [
    createRoute({ name: 'zoo', path: '/zoo' }).addView(component),
    createRoute({ name: 'bar', path: '/bar' }).addView(component),
  ]

  const action: () => void = () => createRouter([aRoutes, bRoutes], {
    initialUrl: '/',
  })

  expect(action).toThrow(DuplicateNamesError)
})

test('given an array of Routes with missing context, can still match missing routes', async () => {
  const missingRoute = createRoute({ name: 'missing', path: '/missing' }).addView(component)

  const router = createRouter([
    createRoute({ name: 'foo', path: '/foo', context: [missingRoute] }).addView(component),
    createRoute({ name: 'bar', path: '/bar' }).addView(component),
  ], {
    initialUrl: '/missing',
  })

  await router.start()

  expect(router.route.name).toBe('missing')
})

test('given an array of Routes with missing context with duplicate route names, throws DuplicateNamesError', async () => {
  const missingRoute = createRoute({ name: 'foo', path: '/foo' }).addView(component)

  const action: () => void = () => createRouter([
    createRoute({ name: 'foo', path: '/foo', context: [missingRoute] }).addView(component),
  ], {
    initialUrl: '/missing',
  })

  expect(action).toThrow(DuplicateNamesError)
})

test('initial route is not set until the router is started', async () => {
  const route = createRoute({ name: 'root', path: '/' }).addView(component)

  const router = createRouter([route], {
    initialUrl: '/',
  })

  expect(router.route.name).toBe('NotFound')

  await router.start()

  expect(router.route.name).toBe('root')
})

test('start shares one promise during and after initialization', async () => {
  const pending = Promise.withResolvers<void>()
  const beforeEnter = vi.fn(() => pending.promise)
  const route = createRoute({ name: 'home', path: '/' })
  route.onBeforeRouteEnter(beforeEnter)
  const router = createRouter([route], { initialUrl: '/' })

  const starting = router.start()

  expect(router.start()).toBe(starting)
  expect(router.started.value).toBe(false)
  pending.resolve()
  await starting

  expect(router.start()).toBe(starting)
  expect(router.started.value).toBe(true)
  expect(beforeEnter).toHaveBeenCalledOnce()
})

test('start shares initialization failures with concurrent and later callers', async () => {
  const failure = new Error('error handler failed')
  const route = createRoute({ name: 'home', path: '/' })
  route.onBeforeRouteEnter(() => {
    throw new Error('navigation failed')
  })
  const router = createRouter([route], { initialUrl: '/' })
  router.onError(() => {
    throw failure
  })

  const results = await Promise.allSettled([router.start(), router.start()])

  expect(results).toEqual([
    { status: 'rejected', reason: failure },
    { status: 'rejected', reason: failure },
  ])
  await expect(router.start()).rejects.toBe(failure)
})

test('the router is started once the initial route commits, without waiting for its after hooks', async () => {
  const { promise, resolve } = Promise.withResolvers<string>()
  const route = createRoute({ name: 'root', path: '/' }).addView(component)

  route.onAfterRouteEnter(async () => {
    await promise
  })

  const router = createRouter([route], { initialUrl: '/' })

  const start = router.start()
  await flushPromises()

  expect(router.started.value).toBe(true)
  expect(router.route.name).toBe('root')

  resolve('continue')
  await start
})

test('a navigation begun from the initial route\'s after hooks leaves from that route', async () => {
  const onBeforeRouteEnter = vi.fn()
  const home = createRoute({ name: 'home', path: '/' }).addView(component)
  const next = createRoute({ name: 'next', path: '/next' }).addView(component)

  home.onAfterRouteEnter((_to, { push }) => {
    push('/next')
  })
  next.onBeforeRouteEnter(onBeforeRouteEnter)

  const router = createRouter([home, next], { initialUrl: '/' })

  await router.start()

  expect(onBeforeRouteEnter).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
    from: expect.objectContaining({ name: 'home' }),
  }))
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
      createRoute({ name: 'kebab', path: '/[test-param]' }).addView(component),
      createRoute({ name: 'snake', path: '/[test_param]' }).addView(component),
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
    const routeWithState = createRoute({ name: 'route-with-state', path: '/route-with-state', state: { zoo: Number } }).addView(component)
    const router = createRouter([routeWithState], { initialUrl: '/' })
    const route = router.resolve('route-with-state', { paramA: 'bar' }, { state: { zoo: 123 } })

    await router.push(route)

    expect(router.route.state).toMatchObject({ zoo: 123 })
  })

  test('given a resolved route with state in options, pushes state', async () => {
    const routeWithState = createRoute({ name: 'route-with-state', path: '/route-with-state', state: { zoo: Number } }).addView(component)
    const router = createRouter([routeWithState], { initialUrl: '/' })
    const route = router.resolve('route-with-state', { paramA: 'bar' })

    await router.push(route, { state: { zoo: 123 } })

    expect(router.route.state).toMatchObject({ zoo: 123 })
  })

  test('given a route name with state in options, pushes state', async () => {
    const routeWithState = createRoute({ name: 'route-with-state', path: '/route-with-state', state: { zoo: Number } }).addView(component)
    const router = createRouter([routeWithState], { initialUrl: '/' })

    await router.push('route-with-state', { paramA: 'bar' }, { state: { zoo: 123 } })

    expect(router.route.state).toMatchObject({ zoo: 123 })
  })

  test('given an internal Url with state in options, pushes state', async () => {
    const routeWithState = createRoute({ name: 'route-with-state', path: '/route-with-state', state: { zoo: Number } }).addView(component)
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

    const route = createRoute({ name: 'route-with-error', path: '/' }).addView(component)

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

    const route = createRoute({ name: 'route-with-error', path: '/[param]' }).addView(component)

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

    const route1 = createRoute({ name: 'route-1', path: '/route-1' }).addView(component)

    const route2 = createRoute({ name: 'route-2', path: '/route-2' }).addView(component)

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

    const routeWithError = createRoute({ name: 'route-with-error', path: '/route-with-error' }).addView(component, {
      props: () => {
        throw error
      },
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

describe('router.onRejection', () => {
  test('given router itself triggers a rejection, calls the onRejection callback with the correct context', async () => {
    const onRejection = vi.fn()

    const rejection = createRejection({
      type: 'CustomRejection',

      status: 404,
      component: { template: '<div>This is a custom rejection</div>' },
    })

    const route = createRoute({ name: 'route', path: '/' }).addView(component)

    const router = createRouter([route], { initialUrl: '/', rejections: [rejection] })

    router.onRejection(onRejection)

    await router.start()

    router.reject('CustomRejection')

    expect(onRejection).toHaveBeenCalledWith('CustomRejection', {
      remove: expect.any(Function),
      to: null,
      from: null,
    })
  })

  test('given route hooks that trigger a rejection, calls the onRejection callback with the correct context', async () => {
    const onRejection = vi.fn()

    const route = createRoute({ name: 'route-with-rejection', path: '/' }).addView(component)

    route.onBeforeRouteEnter((_to, { reject }) => {
      reject('NotFound')
    })

    const router = createRouter([route], { initialUrl: '/' })

    router.onRejection(onRejection)

    await router.start()

    expect(onRejection).toHaveBeenCalledWith('NotFound', {
      remove: expect.any(Function),
      to: expect.objectContaining({
        name: 'route-with-rejection',
      }),
      from: null,
    })
  })
})

describe('options.removeTrailingSlashes', () => {
  const foo = createRoute({ name: 'foo', path: '/foo' }).addView(component)

  const fooWithTrailingSlash = createRoute({ name: 'fooWithTrailingSlash', path: '/foo/' }).addView(component)

  const bar = createRoute({ name: 'bar', path: '/bar' }).addView(component)

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

    // rejects so the route is unchanged
    expect(router.route.href).toBe('/foo/')
  })
})

test('history keeps listening when a navigation ends early', async () => {
  const home = createRoute({ name: 'home', path: '/' }).addView(component)
  const foo = createRoute({ name: 'foo', path: '/foo' }).addView(component)
  const bar = createRoute({ name: 'bar', path: '/bar' }).addView(component)

  bar.onBeforeRouteEnter((_to, { abort }) => abort())

  const router = createRouter([home, foo, bar], { initialUrl: '/' })

  await router.start()
  await router.push('foo')
  await router.push('bar')

  router.back()
  await flushPromises()

  expect(router.route.name).toBe('home')
})

describe('a url that matches no route', () => {
  test('rejects with NotFound', async () => {
    const onRejection = vi.fn()
    const route = createRoute({ name: 'route', path: '/foo' }).addView(component)
    const router = createRouter([route], { initialUrl: '/does-not-exist' })

    router.onRejection(onRejection)

    await router.start()

    expect(onRejection).toHaveBeenCalledWith('NotFound', {
      remove: expect.any(Function),
      to: null,
      from: null,
    })
  })

  test('runs leave hooks with a null to', async () => {
    const onBeforeRouteLeave = vi.fn()
    const onAfterRouteLeave = vi.fn()
    const route = createRoute({ name: 'route', path: '/foo' }).addView(component)
    const router = createRouter([route], { initialUrl: '/foo' })

    await router.start()

    router.onBeforeRouteLeave(onBeforeRouteLeave)
    router.onAfterRouteLeave(onAfterRouteLeave)

    await router.push('/does-not-exist')

    expect(onBeforeRouteLeave).toHaveBeenCalledWith(null, expect.anything())
    expect(onAfterRouteLeave).toHaveBeenCalledWith(null, expect.anything())
  })
})

describe('a navigation ended by one of its hooks', () => {
  test('aborting from a before hook aborts the signal the other before hooks were given', async () => {
    const seen = Promise.withResolvers<AbortSignal>()
    const home = createRoute({ name: 'home', path: '/' }).addView(component)
    const foo = createRoute({ name: 'foo', path: '/foo' }).addView(component)

    foo.onBeforeRouteEnter((_to, { signal }) => {
      seen.resolve(signal)
    })
    foo.onBeforeRouteEnter((_to, { abort }) => {
      abort()
    })

    const router = createRouter([home, foo], { initialUrl: '/' })

    await router.start()
    await router.push('foo')

    const signal = await seen.promise

    expect(signal.aborted).toBe(true)
  })

  test('rejecting from a before hook aborts the signal the other before hooks were given', async () => {
    const seen = Promise.withResolvers<AbortSignal>()
    const home = createRoute({ name: 'home', path: '/' }).addView(component)
    const foo = createRoute({ name: 'foo', path: '/foo' }).addView(component)

    foo.onBeforeRouteEnter((_to, { signal }) => {
      seen.resolve(signal)
    })
    foo.onBeforeRouteEnter((_to, { reject }) => {
      reject('NotFound')
    })

    const router = createRouter([home, foo], { initialUrl: '/' })

    await router.start()
    await router.push('foo')

    const signal = await seen.promise

    expect(signal.aborted).toBe(true)
  })

  test('rejecting from an after hook aborts the signal the other after hooks were given', async () => {
    const seen = Promise.withResolvers<AbortSignal>()
    const home = createRoute({ name: 'home', path: '/' }).addView(component)
    const foo = createRoute({ name: 'foo', path: '/foo' }).addView(component)

    foo.onAfterRouteEnter((_to, { signal }) => {
      seen.resolve(signal)
    })
    foo.onAfterRouteEnter((_to, { reject }) => {
      reject('NotFound')
    })

    const router = createRouter([home, foo], { initialUrl: '/' })

    await router.start()
    await router.push('foo')

    const signal = await seen.promise

    expect(signal.aborted).toBe(true)
  })
})

describe('a navigation superseded by a newer one', () => {
  test('does not update the route or history when its before hooks finish', async () => {
    const { promise, resolve } = Promise.withResolvers<string>()
    const home = createRoute({ name: 'home', path: '/' }).addView(component)
    const slow = createRoute({ name: 'slow', path: '/slow' }).addView(component)
    const fast = createRoute({ name: 'fast', path: '/fast' }).addView(component)

    slow.onBeforeRouteEnter(async () => {
      await promise
    })

    const router = createRouter([home, slow, fast], { initialUrl: '/' })

    await router.start()

    const slowNavigation = router.push('slow')
    await router.push('fast')

    resolve('continue')
    await slowNavigation

    expect(router.route.name).toBe('fast')

    router.back()
    await flushPromises()

    expect(router.route.name).toBe('home')
  })

  test('does not redirect when its after hooks finish', async () => {
    const { promise, resolve } = Promise.withResolvers<string>()
    const home = createRoute({ name: 'home', path: '/' }).addView(component)
    const redirect = createRoute({ name: 'redirect', path: '/redirect' }).addView(component)
    const slow = createRoute({ name: 'slow', path: '/slow', context: [redirect] }).addView(component)
    const fast = createRoute({ name: 'fast', path: '/fast' }).addView(component)

    slow.onAfterRouteEnter(async (_to, { push }) => {
      await promise

      push('redirect')
    })

    const router = createRouter([home, slow, fast, redirect], { initialUrl: '/' })

    await router.start()

    const slowNavigation = router.push('slow')
    await flushPromises()
    await router.push('fast')

    resolve('continue')
    await slowNavigation

    expect(router.route.name).toBe('fast')
  })

  test('aborts the signal its before hooks were given', async () => {
    const { promise, resolve } = Promise.withResolvers<string>()
    const seen = Promise.withResolvers<AbortSignal>()
    const home = createRoute({ name: 'home', path: '/' }).addView(component)
    const slow = createRoute({ name: 'slow', path: '/slow' }).addView(component)
    const fast = createRoute({ name: 'fast', path: '/fast' }).addView(component)

    slow.onBeforeRouteEnter(async (_to, { signal }) => {
      seen.resolve(signal)

      await promise
    })

    const router = createRouter([home, slow, fast], { initialUrl: '/' })

    await router.start()

    const slowNavigation = router.push('slow')
    const signal = await seen.promise

    expect(signal.aborted).toBe(false)

    await router.push('fast')

    expect(signal.aborted).toBe(true)

    resolve('continue')
    await slowNavigation
  })

  test('aborts the signal its after hooks were given', async () => {
    const { promise, resolve } = Promise.withResolvers<string>()
    const seen = Promise.withResolvers<AbortSignal>()
    const home = createRoute({ name: 'home', path: '/' }).addView(component)
    const slow = createRoute({ name: 'slow', path: '/slow' }).addView(component)
    const fast = createRoute({ name: 'fast', path: '/fast' }).addView(component)

    slow.onAfterRouteEnter(async (_to, { signal }) => {
      seen.resolve(signal)

      await promise
    })

    const router = createRouter([home, slow, fast], { initialUrl: '/' })

    await router.start()

    const slowNavigation = router.push('slow')
    const signal = await seen.promise

    expect(signal.aborted).toBe(false)

    await router.push('fast')

    expect(signal.aborted).toBe(true)

    resolve('continue')
    await slowNavigation
  })

  test('does not resume history listening while the newer one is pending', async () => {
    const first = Promise.withResolvers<string>()
    const second = Promise.withResolvers<string>()
    const onBeforeSecond = vi.fn(async () => {
      await second.promise
    })
    const home = createRoute({ name: 'home', path: '/' }).addView(component)
    const firstRoute = createRoute({ name: 'first', path: '/first' }).addView(component)
    const secondRoute = createRoute({ name: 'second', path: '/second' }).addView(component)

    firstRoute.onBeforeRouteEnter(async () => {
      await first.promise
    })
    secondRoute.onBeforeRouteEnter(onBeforeSecond)

    const router = createRouter([home, firstRoute, secondRoute], { initialUrl: '/' })

    await router.start()

    const firstNavigation = router.push('first')
    const secondNavigation = router.push('second')

    first.resolve('continue')
    await firstNavigation

    second.resolve('continue')
    await secondNavigation

    expect(onBeforeSecond).toHaveBeenCalledOnce()
    expect(router.route.name).toBe('second')
  })
})

describe('router.stop', () => {
  test('a navigation in flight when the router stops does not update the route', async () => {
    const { promise, resolve } = Promise.withResolvers<string>()
    const home = createRoute({ name: 'home', path: '/' }).addView(component)
    const slow = createRoute({ name: 'slow', path: '/slow' }).addView(component)

    slow.onBeforeRouteEnter(async () => {
      await promise
    })

    const router = createRouter([home, slow], { initialUrl: '/' })

    await router.start()

    const navigation = router.push('slow')
    router.stop()

    resolve('continue')
    await navigation

    expect(router.route.name).toBe('home')
  })

  test('aborts the signal the hooks of a navigation in flight were given', async () => {
    const { promise, resolve } = Promise.withResolvers<string>()
    const seen = Promise.withResolvers<AbortSignal>()
    const home = createRoute({ name: 'home', path: '/' }).addView(component)
    const slow = createRoute({ name: 'slow', path: '/slow' }).addView(component)

    slow.onBeforeRouteEnter(async (_to, { signal }) => {
      seen.resolve(signal)

      await promise
    })

    const router = createRouter([home, slow], { initialUrl: '/' })

    await router.start()

    const navigation = router.push('slow')
    const signal = await seen.promise

    router.stop()

    expect(signal.aborted).toBe(true)

    resolve('continue')
    await navigation
  })

  test('navigating after stop does not update the route or resume history listening', async () => {
    const home = createRoute({ name: 'home', path: '/' }).addView(component)
    const foo = createRoute({ name: 'foo', path: '/foo' }).addView(component)
    const bar = createRoute({ name: 'bar', path: '/bar' }).addView(component)

    const router = createRouter([home, foo, bar], { initialUrl: '/' })

    await router.start()
    await router.push('foo')

    router.stop()
    await router.push('bar')

    expect(router.route.name).toBe('foo')

    router.back()
    await flushPromises()

    expect(router.route.name).toBe('foo')
  })
})

test('a back during a slow after hook navigates', async () => {
  const { promise, resolve } = Promise.withResolvers<string>()
  const home = createRoute({ name: 'home', path: '/' }).addView(component)
  const slow = createRoute({ name: 'slow', path: '/slow' }).addView(component)

  slow.onAfterRouteEnter(async () => {
    await promise
  })

  const router = createRouter([home, slow], { initialUrl: '/' })

  await router.start()

  const navigation = router.push('slow')
  await flushPromises()

  router.back()
  await flushPromises()

  expect(router.route.name).toBe('home')

  resolve('continue')
  await navigation

  expect(router.route.name).toBe('home')
})

test('going back from a redirect returns to the route before it', async () => {
  const home = createRoute({ name: 'home', path: '/' }).addView(component)
  const oldPath = createRoute({ name: 'oldPath', path: '/old' }).addView(component)
  const newPath = createRoute({ name: 'newPath', path: '/new' }).addView(component)

  const router = createRouter([home, oldPath, newPath], { initialUrl: '/' })

  router.onBeforeRouteEnter((to, { push }) => {
    if (to.name === 'oldPath') {
      push('newPath')
    }
  })

  await router.start()
  await router.push('oldPath')

  expect(router.route.name).toBe('newPath')

  router.back()
  await flushPromises()

  expect(router.route.name).toBe('home')
})

describe.each(['progressive', 'blocking'] as const)('aborted history traversals with %s navigation', (navigation) => {
  const createHistory = createRouterHistoryUtilities.createRouterHistory
  let router: ReturnType<typeof createRouter>
  let history: ReturnType<typeof createHistory>
  let firstEntry: Location
  let secondEntry: Location

  beforeEach(async () => {
    vi.spyOn(createRouterHistoryUtilities, 'createRouterHistory').mockImplementationOnce((options) => {
      history = createHistory(options)

      return history
    })

    const home = createRoute({ name: 'home', path: '/' }).addView(component)
    const first = createRoute({ name: 'first', path: '/first' }).addView(component)
    const second = createRoute({ name: 'second', path: '/second' }).addView(component)
    const third = createRoute({ name: 'third', path: '/third' }).addView(component)
    router = createRouter([home, first, second, third], { initialUrl: '/', historyMode: 'memory', navigation })

    await router.start()
    await router.push('first')
    firstEntry = history.location
    await router.push('second')
    secondEntry = history.location
  })

  afterEach(() => {
    router.stop()
    vi.restoreAllMocks()
  })

  test('aborting Back restores the entry without running hooks again', async () => {
    const before = vi.fn()
    const after = vi.fn()
    router.onBeforeRouteEnter((_to, { abort }) => {
      before()
      abort()
    })
    router.onAfterRouteEnter(after)

    router.back()
    await flushPromises()

    expect(router.route.name).toBe('second')
    expect(history.location).toBe(secondEntry)
    expect(before).toHaveBeenCalledOnce()
    expect(after).not.toHaveBeenCalled()
  })

  test('aborting Forward preserves both entries and allows a later traversal', async () => {
    router.back()
    await flushPromises()
    expect(history.location).toBe(firstEntry)

    const removeAbort = router.onBeforeRouteEnter((_to, { abort }) => abort())

    router.forward()
    await flushPromises()

    expect(router.route.name).toBe('first')
    expect(history.location).toBe(firstEntry)

    removeAbort()
    router.forward()
    await flushPromises()

    expect(router.route.name).toBe('second')
    expect(history.location).toBe(secondEntry)
  })

  test('aborting a multi-entry traversal restores the original entry', async () => {
    router.onBeforeRouteEnter((_to, { abort }) => abort())

    router.go(-2)
    await flushPromises()

    expect(router.route.name).toBe('second')
    expect(history.location).toBe(secondEntry)
  })

  test('aborting between identical URLs restores the original state and key', async () => {
    await router.push('/first', { state: { visit: 1 } })
    const firstVisit = history.location
    await router.push('/first', { state: { visit: 2 } })
    const secondVisit = history.location
    const removeAbort = router.onBeforeRouteUpdate((_to, { abort }) => abort())

    router.back()
    await flushPromises()

    expect(history.location).toBe(secondVisit)
    expect(history.location.state).toEqual({ visit: 2 })

    removeAbort()
    router.back()
    await flushPromises()

    expect(history.location).toBe(firstVisit)
    expect(history.location.state).toEqual({ visit: 1 })
  })

  test('a delayed abort does not roll back a newer successful push', async () => {
    const backGuard = Promise.withResolvers<string>()
    router.onBeforeRouteEnter(async (to, { abort }) => {
      if (to.name === 'first') {
        await backGuard.promise
        abort()
      }
    })

    router.back()
    await flushPromises()
    await router.push('third')
    const thirdEntry = history.location

    backGuard.resolve('continue')
    await flushPromises()

    expect(router.route.name).toBe('third')
    expect(history.location).toBe(thirdEntry)
  })

  test('a superseded Back does not restore while a newer push is awaiting its guard', async () => {
    const backGuard = Promise.withResolvers<string>()
    const pushGuard = Promise.withResolvers<string>()
    router.onBeforeRouteEnter(async (to, { abort }) => {
      if (to.name === 'first') {
        await backGuard.promise
        abort()
      }

      if (to.name === 'third') {
        await pushGuard.promise
      }
    })

    router.back()
    await flushPromises()
    const pushing = router.push('third')
    await flushPromises()

    backGuard.resolve('continue')
    await flushPromises()

    expect(history.location).toBe(firstEntry)

    pushGuard.resolve('continue')
    await pushing

    expect(router.route.name).toBe('third')
  })

  test('a delayed abort does not restore history after the router stops', async () => {
    const backGuard = Promise.withResolvers<string>()
    router.onBeforeRouteEnter(async (_to, { abort }) => {
      await backGuard.promise
      abort()
    })

    router.back()
    await flushPromises()
    expect(history.location).toBe(firstEntry)

    router.stop()
    backGuard.resolve('continue')
    await flushPromises()

    expect(router.route.name).toBe('second')
    expect(history.location).toBe(firstEntry)
  })

  test('an accepted Back is remembered before its after hooks finish', async () => {
    const afterHook = Promise.withResolvers<string>()
    router.onAfterRouteEnter(async (to) => {
      if (to.name === 'first') {
        await afterHook.promise
      }
    })
    router.onBeforeRouteEnter((to, { abort }) => {
      if (to.name === 'home') {
        abort()
      }
    })

    router.back()
    await flushPromises()
    expect(router.route.name).toBe('first')

    router.back()
    await flushPromises()

    expect(router.route.name).toBe('first')
    expect(history.location).toBe(firstEntry)

    afterHook.resolve('continue')
    await flushPromises()
  })
})

function rendered(response: ServerRenderResponse): Exclude<ServerRenderResponse, RenderRedirect> {
  if (response.kind === 'redirect') {
    throw new Error('expected a rendered response, got a redirect')
  }

  return response
}

function successful(response: ServerRenderResponse): RenderSuccess {
  if (response.kind !== 'success') {
    throw new Error(`expected a success response, got ${response.kind}`)
  }

  return response
}

describe('router.render response', () => {
  test('render requires the router to be created for server rendering', async () => {
    const route = createRoute({ name: 'route', path: '/' }).addView(component)
    const router = createRouter([route], { initialUrl: '/' })

    await expect(router.render()).rejects.toThrow(SsrOptionRequiredError)
  })

  test('given an absolute initial url, a relative settled url is not a redirect', async () => {
    const route = createRoute({ name: 'route', path: '/foo' }).addView(component)
    const router = createRouter([route], { ssr: true, initialUrl: 'https://kitbag.dev/foo' })

    await router.start()

    const result = await router.render()

    expect(result).toMatchObject({ kind: 'success', status: 200 })
  })

  test('after hooks are left for the client even when the router starts before render', async () => {
    const onAfterRouteEnter = vi.fn()

    const route = createRoute({ name: 'route', path: '/' }).addView(component)
    const router = createRouter([route], { ssr: true, initialUrl: '/' })

    router.onAfterRouteEnter(onAfterRouteEnter)

    await router.start()
    await router.render()

    expect(onAfterRouteEnter).not.toHaveBeenCalled()
  })

  test('a value json cannot write is left out of the payload and returned as a failure', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const circular: Record<string, unknown> = {}
    circular.self = circular

    const route = createRoute({ name: 'route', path: '/' }).addView(component)
      .addLoader(() => circular)
    const router = createRouter([route], { ssr: true, initialUrl: '/' })

    await router.start()

    const result = successful(await router.render())
    const payload: unknown = JSON.parse(result.payload.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''))

    expect(payload).toMatchObject({ values: [] })
    expect(result.failures).toMatchObject([expect.any(PayloadValueError)])
    expect(warn).toHaveBeenCalled()

    warn.mockRestore()
  })

  test('returns the title of the route that rendered', async () => {
    const route = createRoute({ name: 'route', path: '/' }).addView(component)
    const title = vi.fn(() => 'the title')

    route.setTitle(title)

    const router = createRouter([route], { ssr: true, initialUrl: '/' })

    const result = rendered(await router.render())

    expect(result.title).toBe('the title')
    expect(title).toHaveBeenCalledTimes(1)
  })

  test('returns the title of the rejection that rendered', async () => {
    const locked = createRejection({ type: 'Locked', status: 423, component })
    const title = vi.fn(() => 'locked')

    locked.setTitle(title)

    const route = createRoute({ name: 'route', path: '/' }).addView(component)
    const router = createRouter([route], { ssr: true, initialUrl: '/', rejections: [locked] })

    router.onBeforeRouteEnter((_to, { reject }) => reject('Locked'))

    const result = rendered(await router.render())

    expect(result.title).toBe('locked')
    expect(title).toHaveBeenCalledTimes(1)
  })

  test('a rejection without a title resolves the current route title once', async () => {
    const locked = createRejection({ type: 'Locked', component })
    const route = createRoute({ name: 'route', path: '/' }).addView(component)
    const title = vi.fn(() => 'the title')

    route.setTitle(title)

    const router = createRouter([route], { ssr: true, initialUrl: '/', rejections: [locked] })

    await router.start()

    router.reject('Locked')

    const result = rendered(await router.render())

    expect(result).toMatchObject({ kind: 'reject', title: 'the title' })
    expect(title).toHaveBeenCalledTimes(1)
  })

  test.each(['success', 'reject'] as const)('awaits the async title for a %s response', async (kind) => {
    const pending = Promise.withResolvers<string>()
    const title = vi.fn(() => pending.promise)
    const locked = createRejection({ type: 'Locked', component })
    const route = createRoute({ name: 'route', path: '/' }).addView(component)

    route.setTitle(title)
    locked.setTitle(title)

    const router = createRouter([route], { ssr: true, initialUrl: '/', rejections: [locked] })

    if (kind === 'reject') {
      router.onBeforeRouteEnter((_to, { reject }) => reject('Locked'))
    }

    const settled = vi.fn()
    const rendering = router.render().then((response) => {
      settled()

      return response
    })

    await flushPromises()

    expect(title).toHaveBeenCalledTimes(1)
    expect(settled).not.toHaveBeenCalled()

    pending.resolve('async title')

    expect(await rendering).toMatchObject({ kind, title: 'async title' })
  })

  test.each(['success', 'reject'] as const)('a failed title rejects render for a %s response', async (kind) => {
    const failure = new Error('title failed')
    const title = vi.fn(async () => {
      throw failure
    })
    const locked = createRejection({ type: 'Locked', component })
    const route = createRoute({ name: 'route', path: '/' }).addView(component)

    route.setTitle(title)
    locked.setTitle(title)

    const router = createRouter([route], { ssr: true, initialUrl: '/', rejections: [locked] })

    if (kind === 'reject') {
      router.onBeforeRouteEnter((_to, { reject }) => reject('Locked'))
    }

    await expect(router.render()).rejects.toBe(failure)

    expect(title).toHaveBeenCalledTimes(1)
  })

  test('render leaves after hooks for the client', async () => {
    const onAfterRouteEnter = vi.fn()

    const route = createRoute({ name: 'route', path: '/' }).addView(component)
    const router = createRouter([route], { ssr: true, initialUrl: '/' })

    router.onAfterRouteEnter(onAfterRouteEnter)

    await router.render()

    expect(onAfterRouteEnter).not.toHaveBeenCalled()
  })

  test('a rejection without a title returns no title', async () => {
    const locked = createRejection({ type: 'Locked', status: 423, component })

    const route = createRoute({ name: 'route', path: '/' }).addView(component)

    route.setTitle(() => 'the title')

    const router = createRouter([route], { ssr: true, initialUrl: '/', rejections: [locked] })

    router.onBeforeRouteEnter((_to, { reject }) => reject('Locked'))

    await router.start()

    const result = rendered(await router.render())

    expect(result.title).toBeUndefined()
  })

  test('a value crosses the payload through its own stringify', async () => {
    const route = createRoute({ name: 'route', path: '/' }).addView(component)
      .addLoader(() => new Map([['a', 1]]), {
        transformer: {
          stringify: (value) => JSON.stringify(Array.from(value.entries())),
          parse: (encoded) => new Map(JSON.parse(encoded)),
        },
      })

    const router = createRouter([route], { ssr: true, initialUrl: '/' })

    await router.start()

    const response = rendered(await router.render())
    const payload: unknown = JSON.parse(response.payload.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''))

    expect(payload).toMatchObject({
      values: [{ kind: 'loader', depth: 0, name: 'default', encoded: '[["a",1]]' }],
    })
  })

  test('a declared payload option that cannot write a value is left out and returned as a failure', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const route = createRoute({ name: 'route', path: '/' }).addView(component)
      .addLoader(() => 1, {
        transformer: {
          stringify: () => {
            throw new Error('nope')
          },
          parse: Number,
        },
      })

    const router = createRouter([route], { ssr: true, initialUrl: '/' })

    await router.start()

    const result = successful(await router.render())
    const payload: unknown = JSON.parse(result.payload.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''))

    expect(payload).toMatchObject({ values: [] })
    expect(result.failures).toMatchObject([expect.any(PayloadValueError)])
    expect(warn).toHaveBeenCalled()

    warn.mockRestore()
  })

  test('a rejected render carries the rejection in its payload', async () => {
    const route = createRoute({ name: 'route', path: '/foo' }).addView(component)
    const router = createRouter([route], { ssr: true, initialUrl: '/does-not-exist' })

    await router.start()

    const result = rendered(await router.render())
    const payload: unknown = JSON.parse(result.payload.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''))

    expect(payload).toStrictEqual({ kind: 'reject', url: '/does-not-exist', rejection: 'NotFound' })
  })

  test('given a url that matches a route, returns 200', async () => {
    const route = createRoute({ name: 'route', path: '/' }).addView(component)
    const router = createRouter([route], { ssr: true, initialUrl: '/' })

    await router.start()

    const result = await router.render()

    expect(result).toMatchObject({ kind: 'success', status: 200 })
  })

  test('given a url that matches no route, returns 404', async () => {
    const route = createRoute({ name: 'route', path: '/foo' }).addView(component)
    const router = createRouter([route], { ssr: true, initialUrl: '/does-not-exist' })

    await router.start()

    const result = await router.render()

    expect(result.status).toBe(404)
  })

  test('given a hook that rejects with NotFound, returns 404', async () => {
    const route = createRoute({ name: 'route', path: '/' }).addView(component)

    route.onBeforeRouteEnter((_to, { reject }) => {
      reject('NotFound')
    })

    const router = createRouter([route], { ssr: true, initialUrl: '/' })

    await router.start()

    const result = await router.render()

    expect(result).toMatchObject({ status: 404, rejection: 'NotFound' })
  })

  test('given a rejection that declares a status, returns that status', async () => {
    const rejection = createRejection({ type: 'Unauthorized', status: 401 })
    const route = createRoute({ name: 'route', path: '/' }).addView(component)
    const router = createRouter([route], { ssr: true, initialUrl: '/', rejections: [rejection] })

    router.onBeforeRouteEnter((_to, { reject }) => {
      reject('Unauthorized')
    })

    await router.start()

    const result = await router.render()

    expect(result).toMatchObject({ status: 401, rejection: 'Unauthorized' })
  })

  test('given a rejection, returns the status it declared', async () => {
    const rejection = createRejection({ type: 'Maintenance', status: 503 })
    const route = createRoute({ name: 'route', path: '/' }).addView(component)
    const router = createRouter([route], { ssr: true, initialUrl: '/', rejections: [rejection] })

    router.onBeforeRouteEnter((_to, { reject }) => {
      reject('Maintenance')
    })

    await router.start()

    const result = await router.render()

    expect(result).toMatchObject({ status: 503, rejection: 'Maintenance' })
  })

  test('given a rejection without a status, responds 200', async () => {
    const rejection = createRejection({ type: 'Locked' })
    const route = createRoute({ name: 'route', path: '/' }).addView(component)
    const router = createRouter([route], { ssr: true, initialUrl: '/', rejections: [rejection] })

    router.onBeforeRouteEnter((_to, { reject }) => {
      reject('Locked')
    })

    await router.start()

    const result = await router.render()

    expect(result).toMatchObject({ status: 200, rejection: 'Locked' })
  })

  test('given rejectStatus, uses it for a rejection without a status of its own', async () => {
    const rejection = createRejection({ type: 'Locked' })
    const route = createRoute({ name: 'route', path: '/' }).addView(component)
    const router = createRouter([route], { ssr: true, initialUrl: '/', rejections: [rejection], rejectStatus: 403 })

    router.onBeforeRouteEnter((_to, { reject }) => {
      reject('Locked')
    })

    await router.start()

    const result = await router.render()

    expect(result).toMatchObject({ status: 403, rejection: 'Locked' })
  })

  test('a rejection status wins over rejectStatus', async () => {
    const rejection = createRejection({ type: 'Locked', status: 423 })
    const route = createRoute({ name: 'route', path: '/' }).addView(component)
    const router = createRouter([route], { ssr: true, initialUrl: '/', rejections: [rejection], rejectStatus: 403 })

    router.onBeforeRouteEnter((_to, { reject }) => {
      reject('Locked')
    })

    await router.start()

    const result = await router.render()

    expect(result).toMatchObject({ status: 423, rejection: 'Locked' })
  })

  test('given a url with a trailing slash, redirects to the url without it', async () => {
    const route = createRoute({ name: 'route', path: '/foo' }).addView(component)
    const router = createRouter([route], { ssr: true, initialUrl: '/foo/' })

    await router.start()

    const result = await router.render()

    expect(result).toMatchObject({ status: 302, location: '/foo' })
  })

  test('given redirectStatus, uses it for a normalized url', async () => {
    const route = createRoute({ name: 'route', path: '/foo' }).addView(component)
    const router = createRouter([route], { ssr: true, initialUrl: '/foo/', redirectStatus: 301 })

    await router.start()

    const result = await router.render()

    expect(result).toMatchObject({ status: 301, location: '/foo' })
  })

  test('given removeTrailingSlashes false, does not normalize', async () => {
    const route = createRoute({ name: 'route', path: '/foo' }).addView(component)
    const router = createRouter([route], { ssr: true, initialUrl: '/foo/', removeTrailingSlashes: false })

    await router.start()

    const result = await router.render()

    expect(result).toMatchObject({ kind: 'reject', status: 404, rejection: 'NotFound' })
  })

  test('a hook that pushes responds 302 even with a redirect status', async () => {
    const home = createRoute({ name: 'home', path: '/' }).addView(component)
    const other = createRoute({ name: 'other', path: '/other' }).addView(component)

    const router = createRouter([home, other], { ssr: true, initialUrl: '/', redirectStatus: 301 })

    router.onBeforeRouteEnter((to, { push }) => {
      if (to.name === 'home') {
        push('other')
      }
    })

    await router.start()

    const result = await router.render()

    expect(result).toMatchObject({ kind: 'redirect', status: 302, location: '/other' })
  })

  test('a route redirect responds with the redirect status', async () => {
    const to = createRoute({ name: 'to', path: '/to' }).addView(component)
    const from = createRoute({ name: 'from', path: '/from' }).addView(component)

    from.redirectTo(to)

    const router = createRouter([from, to], { ssr: true, initialUrl: '/from', redirectStatus: 301 })

    const result = await router.render()

    expect(result).toMatchObject({ kind: 'redirect', status: 301, location: '/to' })
  })

  test('a redirect declaring its own status overrides the redirect status', async () => {
    const to = createRoute({ name: 'to', path: '/to' }).addView(component)
    const from = createRoute({ name: 'from', path: '/from' }).addView(component)

    from.redirectTo(to, undefined, { status: 301 })

    const router = createRouter([from, to], { ssr: true, initialUrl: '/from' })

    const result = await router.render()

    expect(result).toMatchObject({ kind: 'redirect', status: 301, location: '/to' })
  })

  test('a redirect chain responds with the first hop', async () => {
    const c = createRoute({ name: 'c', path: '/c' }).addView(component)
    const b = createRoute({ name: 'b', path: '/b' }).addView(component)
    const a = createRoute({ name: 'a', path: '/a' }).addView(component)

    a.redirectTo(b, undefined, { status: 301 })
    b.onBeforeRouteEnter((_to, { push }) => push('/c'))

    const router = createRouter([a, b, c], { ssr: true, initialUrl: '/a' })

    const result = await router.render()

    expect(result).toMatchObject({ kind: 'redirect', status: 301, location: '/b' })
  })

  test('a hook that pushes during the render responds 302 without being followed', async () => {
    const home = createRoute({ name: 'home', path: '/' }).addView(component)
    const other = createRoute({ name: 'other', path: '/other' }).addView(component)

    const router = createRouter([home, other], { ssr: true, initialUrl: '/', redirectStatus: 301 })

    router.onBeforeRouteEnter((to, { push }) => {
      if (to.name === 'home') {
        push('/other')
      }
    })

    const result = await router.render()

    expect(result).toMatchObject({ kind: 'redirect', status: 302, location: '/other' })
  })

  test('given a route that redirects, returns 302 to the destination', async () => {
    const from = createRoute({ name: 'from', path: '/from' }).addView(component)
    const to = createRoute({ name: 'to', path: '/to' }).addView(component)

    from.redirectTo(to)

    const router = createRouter([from, to], { ssr: true, initialUrl: '/from' })

    await router.start()

    const result = await router.render()

    expect(result).toMatchObject({ status: 302, location: '/to' })
  })

  test('given extra query params that the router reorders, does not report a redirect', async () => {
    const route = createRoute({ name: 'route', path: '/', query: 'foo=[param]' }).addView(component)
    const router = createRouter([route], { ssr: true, initialUrl: '/?extra=42&foo=1' })

    await router.start()

    const result = await router.render()

    expect(result).toMatchObject({ status: 200 })
  })

  test('calling render again resolves with the same response', async () => {
    const route = createRoute({ name: 'route', path: '/' }).addView(component)
    const router = createRouter([route], { ssr: true, initialUrl: '/' })

    await router.start()

    const first = await router.render()
    const second = await router.render()

    expect(second).toStrictEqual(first)
  })
})

test('blocking navigation handles a redirect without waiting for other loaders', async () => {
  const home = createRoute({ name: 'home', path: '/' })
  const target = createRoute({ name: 'target', path: '/target' })
  const page = createRoute({ name: 'page', path: '/page' })
    .addLoader((_route, { push }) => push('/target'), { name: 'redirect' })
    .addLoader(() => new Promise(() => {}), { name: 'pending' })
  const router = createRouter([home, page, target], {
    initialUrl: '/',
    navigation: 'blocking',
  })
  await router.start()

  await router.push('page')

  await vi.waitFor(() => expect(router.route.name).toBe('target'))
  router.stop()
})

test('superseded preparation ignores a late loader redirect', async () => {
  const started = Promise.withResolvers<AbortSignal>()
  const slow = Promise.withResolvers<void>()
  const home = createRoute({ name: 'home', path: '/' })
  const pending = createRoute({ name: 'pending', path: '/pending' })
    .addLoader(async (_route, { push, signal }) => {
      started.resolve(signal)
      await slow.promise
      push('/elsewhere')
    })
  const target = createRoute({ name: 'target', path: '/target' })
  const elsewhere = createRoute({ name: 'elsewhere', path: '/elsewhere' })
  const router = createRouter([home, pending, target, elsewhere], { initialUrl: '/', navigation: 'blocking' })
  await router.start()

  const preparing = router.push('pending')
  const signal = await started.promise
  await router.push('target')

  expect(signal.aborted).toBe(true)
  slow.resolve()
  await preparing
  await flushPromises()

  expect(router.route.name).toBe('target')
  router.stop()
})

test('superseded preparation ignores a late loader error', async () => {
  const started = Promise.withResolvers<void>()
  const slow = Promise.withResolvers<void>()
  const home = createRoute({ name: 'home', path: '/' })
  const pending = createRoute({ name: 'pending', path: '/pending' })
    .addLoader(async () => {
      started.resolve()
      await slow.promise
      throw new Error('obsolete loader')
    })
  const target = createRoute({ name: 'target', path: '/target' })
  const router = createRouter([home, pending, target], { initialUrl: '/', navigation: 'blocking' })
  const onError = vi.fn()
  router.onError(onError)
  await router.start()

  const preparing = router.push('pending')
  await started.promise
  await router.push('target')
  slow.resolve()
  await preparing
  await flushPromises()

  expect(router.route.name).toBe('target')
  expect(onError).not.toHaveBeenCalled()
  router.stop()
})

test('a before hook redirect discards prefetched work for the original route', async () => {
  const slow = Promise.withResolvers<void>()
  const started = Promise.withResolvers<AbortSignal>()
  const home = createRoute({ name: 'home', path: '/' })
  const prefetched = createRoute({ name: 'prefetched', path: '/prefetched' })
    .addLoader(async (_route, { push, signal }) => {
      started.resolve(signal)
      await slow.promise
      push('/elsewhere')
    })
  prefetched.onBeforeRouteEnter((_route, { push }) => push('/target'))
  const target = createRoute({ name: 'target', path: '/target' })
  const elsewhere = createRoute({ name: 'elsewhere', path: '/elsewhere' })
  const router = createRouter([home, prefetched, target, elsewhere], { initialUrl: '/' })
  const app = createApp({ render: () => null })
  app.use(router)
  await router.start()
  const useRouterNavigation = createUseRouterNavigation(router.key)
  const navigation = app.runWithContext(useRouterNavigation)
  const prepared = navigation.create()
  const route = router.resolve('prefetched')
  prepared.compute(route, getComputations(route))
  const options: RouterPushOptionsInternal = { prefetch: prepared }

  await router.push(route, options)
  slow.resolve()
  await flushPromises()

  const signal = await started.promise
  expect(signal.aborted).toBe(true)
  expect(router.route.name).toBe('target')
  router.stop()
})

test('prefetched navigation actions win in completion order', async () => {
  const first = Promise.withResolvers<void>()
  const second = Promise.withResolvers<void>()
  const home = createRoute({ name: 'home', path: '/' })
  const page = createRoute({ name: 'page', path: '/page' })
    .addLoader(async (_route, { push }) => {
      await first.promise
      push('/first')
    }, { name: 'first' })
    .addLoader(async (_route, { push }) => {
      await second.promise
      push('/second')
    }, { name: 'second' })
  const firstTarget = createRoute({ name: 'first', path: '/first' })
  const secondTarget = createRoute({ name: 'second', path: '/second' })
  const router = createRouter([home, page, firstTarget, secondTarget], { initialUrl: '/' })
  const app = createApp({ render: () => null })
  app.use(router)
  await router.start()
  const useRouterNavigation = createUseRouterNavigation(router.key)
  const navigation = app.runWithContext(useRouterNavigation)
  const prepared = navigation.create()
  const resolved = router.resolve('page')
  prepared.compute(resolved, getComputations(resolved))

  second.resolve()
  await flushPromises()
  first.resolve()
  await flushPromises()
  const options: RouterPushOptionsInternal = { prefetch: prepared }
  await router.push(resolved, options)

  await vi.waitFor(() => expect(router.route.href).toBe('/second'))
  router.stop()
})
