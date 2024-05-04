import { flushPromises } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { toRefs } from 'vue'
import { createRouter } from '@/services/createRouter'
import { createRoutes } from '@/services/createRoutes'
import { component } from '@/utilities/testHelpers'

test('initial route is set', async () => {
  const routes = createRoutes([
    {
      name: 'root',
      component,
      path: '/',
    },
  ])

  const { route, initialized } = createRouter(routes, {
    initialUrl: '/',
  })

  await initialized

  expect(route.matched.name).toBe('root')
})

test('updates the route when navigating', async () => {
  const routes = createRoutes([
    {
      name: 'first',
      component,
      path: '/first',
    },
    {
      name: 'second',
      component,
      path: '/second',
    },
    {
      name: 'third',
      component,
      path: '/third/:id',
    },
  ])

  const { push, route, initialized } = createRouter(routes, {
    initialUrl: '/first',
  })

  await initialized

  expect(route.matched.name).toBe('first')

  await push('/second')

  expect(route.matched.name).toBe('second')
})

test('route update updates the current route', async () => {
  const routes = createRoutes([
    {
      name: 'root',
      component,
      path: '/:param',
    },
  ])

  const router = createRouter(routes, {
    initialUrl: '/one',
  })

  await router.initialized

  await router.route.update('param', 'two')

  expect(router.route.params.param).toBe('two')

  await router.route.update({
    param: 'three',
  })

  expect(router.route.params.param).toBe('three')

})

test('route is readonly except for individual params', async () => {
  const routes = createRoutes([
    {
      name: 'root',
      component,
      path: '/',
    },
  ])
  const { route, initialized } = createRouter(routes, {
    initialUrl: '/',
  })

  await initialized

  // @ts-expect-error
  route.key = 'child'
  expect(route.key).toBe('root')

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

test('individual prams are writable', async () => {
  const routes = createRoutes([
    {
      name: 'root',
      component,
      path: '/:param',
    },
  ])

  const { route, initialized } = createRouter(routes, {
    initialUrl: '/one',
  })

  await initialized

  route.params.param = 'goodbye'

  await flushPromises()

  expect(route.params.param).toBe('goodbye')

  const { param } = toRefs(route.params)

  param.value = 'again'

  await flushPromises()

  expect(route.params.param).toBe('again')

  route.params.nothing = 'nothing'

  await flushPromises()

  expect(route.params.nothing).toBeUndefined()
})

test('individual params are writable when using toRefs', async () => {
  const routes = createRoutes([
    {
      name: 'root',
      component,
      path: '/:param',
    },
  ])

  const { route, initialized } = createRouter(routes, {
    initialUrl: '/one',
  })

  await initialized

  const { param } = toRefs(route.params)

  param.value = 'two'

  await flushPromises()

  expect(route.params.param).toBe('two')
})

test('setting an unknown param does not add its value to the route', async () => {
  const routes = createRoutes([
    {
      name: 'root',
      component,
      path: '/',
    },
  ])

  const { route, initialized } = createRouter(routes, {
    initialUrl: '/',
  })

  await initialized

  route.params.nothing = 'nothing'

  await flushPromises()

  expect(route.params.nothing).toBeUndefined()
})