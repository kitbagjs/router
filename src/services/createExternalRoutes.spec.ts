import { expect, test } from 'vitest'
import { createExternalRoutes } from '@/services/createExternalRoutes'

test('when given external route props with a host return a route with a host', () => {
  const [route] = createExternalRoutes([
    {
      host: 'https://kitbag.dev',
      name: 'kitbag',
    },
  ])

  expect(route.host.toString()).toBe('https://kitbag.dev')
})

test('when given external route props with a host and children return host for each route', () => {
  const [routeA, routeB] = createExternalRoutes([
    {
      host: 'https://kitbag.dev',
      children: createExternalRoutes([
        {
          name: 'foo',
          path: 'child',
        },
      ]),
    },
  ])

  expect(routeA.host.toString()).toBe('https://kitbag.dev')
  expect(routeB.host.toString()).toBe('https://kitbag.dev')
})