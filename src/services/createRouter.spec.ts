import { flushPromises } from '@vue/test-utils'
import { Location } from 'history'
import { expect, test, vi } from 'vitest'
import { toRefs } from 'vue'
import { DuplicateNamesError } from '@/errors/duplicateNamesError'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import * as createRouterHistoryUtilities from '@/services/createRouterHistory'
import * as resolveUtilities from '@/services/createRouterResolve'
import { component } from '@/utilities/testHelpers'

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

  // @ts-expect-error
  route.name = 'child'
  expect(route.name).toBe('root')

  // @ts-expect-error
  route.matched = 'match'
  expect(route.matched).toMatchObject(routes[0].matched)

  // @ts-expect-error
  route.matches = 'matches'
  expect(route.matches).toMatchObject(routes[0].matches)

  // @ts-expect-error
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

  // @ts-expect-error
  route.params.nothing = 'nothing'

  await flushPromises()

  // @ts-expect-error
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

  // @ts-expect-error
  route.params.nothing = 'nothing'

  await flushPromises()

  // @ts-expect-error
  expect(route.params.nothing).toBeUndefined()
})

test('given an array of Routes, combines into single routes collection', () => {
  const aRoutes = [
    createRoute({ name: 'a-route-1', path: '/a-route-1', component }),
    createRoute({ name: 'a-route-2', path: '/a-route-2', component }),
  ]
  const bRoutes = [
    createRoute({ name: 'b-route-1', path: '/b-route-1', component }),
    createRoute({ name: 'b-route-2', path: '/b-route-2', component }),
  ]

  const spy = vi.spyOn(resolveUtilities, 'createRouterResolve')

  createRouter([aRoutes, bRoutes], {
    initialUrl: '/',
  })

  expect(spy).toHaveBeenLastCalledWith([
    ...aRoutes,
    ...bRoutes,
  ])
})

test('given an array of Routes with duplicate names, throws ', () => {
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