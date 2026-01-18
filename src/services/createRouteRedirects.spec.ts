import { MultipleRouteRedirectsError } from '@/errors/multipleRouteRedirectsError'
import { createRoute, createRouter } from '@/main'
import { expect, test } from 'vitest'

test('redirectTo correctly redirects to the to route', async () => {
  const to = createRoute({
    name: 'to',
    path: '/to',
  })

  const from = createRoute({
    name: 'from',
    path: '/from',
  })

  from.redirectTo(to)

  const router = createRouter([to, from], { initialUrl: '/from' })

  await router.start()

  expect(router.route.href).toBe('/to')
})

test('redirectFrom correctly redirects from the from route', async () => {
  const to = createRoute({
    name: 'to',
    path: '/to',
  })

  const from = createRoute({
    name: 'from',
    path: '/from',
  })

  to.redirectFrom(from)

  const router = createRouter([to, from], { initialUrl: '/from' })

  await router.start()

  expect(router.route.href).toBe('/to')
})

test('redirectTo correctly redirects to the to route with params', async () => {
  const paramValue = 'paramValue'

  const to = createRoute({
    name: 'to',
    path: '/to/[toParam]',
  })

  const from = createRoute({
    name: 'from',
    path: '/from/[fromParam]',
  })

  to.redirectFrom(from, ({ fromParam }) => {
    expect(fromParam).toEqual(paramValue)

    return { toParam: fromParam }
  })

  const router = createRouter([to, from], {
    initialUrl: `/from/${paramValue}`,
  })

  await router.start()

  expect(router.route.href).toBe(`/to/${paramValue}`)
})

test('redirectFrom correctly redirects from the from route with params', async () => {
  const paramValue = 'paramValue'

  const to = createRoute({
    name: 'to',
    path: '/to/[toParam]',
  })

  const from = createRoute({
    name: 'from',
    path: '/from/[fromParam]',
  })

  from.redirectTo(to, ({ fromParam }) => {
    expect(fromParam).toEqual(paramValue)

    return { toParam: fromParam }
  })

  const router = createRouter([to, from], {
    initialUrl: `/from/${paramValue}`,
  })

  await router.start()

  expect(router.route.href).toBe(`/to/${paramValue}`)
})

test('throws MultipleRouteRedirectsError when a route has multiple redirects', () => {
  const to = createRoute({
    name: 'to',
    path: '/to',
  })

  const from = createRoute({
    name: 'from',
    path: '/from',
  })

  to.redirectFrom(from)

  expect(() => to.redirectFrom(from)).toThrow(MultipleRouteRedirectsError)
  expect(() => from.redirectTo(to)).toThrow(MultipleRouteRedirectsError)
})
