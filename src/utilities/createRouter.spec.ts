import { flushPromises } from '@vue/test-utils'
import { expect, test, vi } from 'vitest'
import { toRefs } from 'vue'
import { createRouter } from '@/utilities/createRouter'
import { createRoutes } from '@/utilities/createRoutes'
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

test('route is readonly except for individual params', async () => {
  const routes = createRoutes([
    {
      name: 'root',
      component,
      path: '/:param',
    },
  ])

  const router = createRouter(routes, {
    initialUrl: '/hello',
  })

  await router.initialized

  const spy = vi.spyOn(router, 'push')

  const { route } = router

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
  expect(route.params).toMatchObject({ param: 'hello' })

  // @ts-expect-error
  route.params.param = 'goodbye'

  expect(spy).toHaveBeenCalledOnce()

  await flushPromises()

  // @ts-expect-error
  expect(route.params.param).toBe('goodbye')

  // @ts-expect-error
  const { param } = toRefs(route.params)

  param.value = 'again'

  expect(spy).toHaveBeenCalledTimes(2)

  await flushPromises()

  // @ts-expect-error
  expect(route.params.param).toBe('again')
})