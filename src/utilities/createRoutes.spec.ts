import { describe, expect, test } from 'vitest'
import RouterView from '@/components/routerView.vue'
import { createRoutes } from '@/utilities/createRoutes'
import { component } from '@/utilities/testHelpers'

describe('route key dot notation', () => {

  test('given named routes, returns string of each route name', () => {
    const routes = createRoutes([
      {
        name: 'grandparent',
        path: '/grandparent',
        children: createRoutes([
          {
            name: 'parent',
            path: '/parent',
            children: createRoutes([
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
    expect(childRoute?.key).toBe('grandparent.parent.child')
  })

  test('given parents without names, returns only the leaf', () => {
    const routes = createRoutes([
      {
        path: '/grandparent',
        children: createRoutes([
          {
            path: '/parent',
            children: createRoutes([
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
    expect(childRoute?.key).toBe('child')
  })

})

test('given route without component, sets component default to RouterView', () => {
  const [route] = createRoutes([
    {
      name: 'without-component',
      path: '/without-component',
      children: [],
    },
  ])

  expect(route.matched.component).toMatchObject(RouterView)
})