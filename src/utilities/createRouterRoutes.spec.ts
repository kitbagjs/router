import { describe, expect, test } from 'vitest'
import { createRouterRoutes } from '@/utilities/createRouterRoutes'
import { component } from '@/utilities/testHelpers'

describe('route name dot notation', () => {

  test('given named routes, returns string of each route name', () => {
    const routes = createRouterRoutes([
      {
        name: 'grandparent',
        path: '/grandparent',
        children: createRouterRoutes([
          {
            name: 'parent',
            path: '/parent',
            children: createRouterRoutes([
              {
                name: 'child',
                path: '/child',
                component,
              },
            ]),
          },
        ]),
      },
    ])

    const childRoute = routes.find(route => route.matched.name === 'child')
    expect(childRoute?.name).toBe('grandparent.parent.child')
  })

  test('given parents without names, returns only the leaf', () => {
    const routes = createRouterRoutes([
      {
        path: '/grandparent',
        children: createRouterRoutes([
          {
            path: '/parent',
            children: createRouterRoutes([
              {
                name: 'child',
                path: '/child',
                component,
              },
            ]),
          },
        ]),
      },
    ])

    const childRoute = routes.find(route => route.matched.name === 'child')
    expect(childRoute?.name).toBe('child')
  })

})