import { describe, expect, test } from 'vitest'
import { Routes } from '@/types'
import { createRouter } from '@/utilities'

const component = { template: '<div>This is component</div>' }

describe('router.routeMatch', () => {
  test('given path WITHOUT params, returns match', () => {
    const routes = [
      {
        name: 'parent',
        path: '/parent',
        children: [
          {
            name: 'child',
            path: '/child',
            children: [
              {
                name: 'grandchild',
                path: '/grandchild',
                component,
              },
            ],
          },
        ],
      },
    ] as const satisfies Routes

    const router = createRouter(routes)
    const match = router.routeMatch('/parent/child/grandchild')

    expect(match?.name).toBe('grandchild')
  })

  test('given path to unnamed parent, without option to get to leaf, returns undefined', () => {
    const routes = [
      {
        path: '/unnamed',
        children: [
          {
            name: 'unnamed-child',
            path: '/unnamed-child/:child-id',
            children: [
              {
                name: 'namedGrandchild',
                path: '/named-grandchild',
                component,
              },
            ],
          },
        ],
      },
    ] as const satisfies Routes

    const router = createRouter(routes)
    const match = router.routeMatch('/unnamed')

    expect(match).toBeUndefined()
  })

  test('given path to unnamed  parent, with option to get to leaf, returns available leaf', () => {
    const routes = [
      {
        path: '/unnamed',
        children: [
          {
            name: 'unnamed-child-root',
            path: '',
            component,
          },
        ],
      },
    ] as const satisfies Routes
    const router = createRouter(routes)
    const match = router.routeMatch('/unnamed')

    expect(match?.name).toBe('unnamed-child-root')
  })

  test('given path that includes named parent and path to leaf, return first match', () => {
    const router = createRouter([
      {
        name: 'namedParent',
        path: '/named-parent',
        children: [
          {
            name: 'namedChild',
            path: '',
            children: [
              {
                name: 'namedGrandchild',
                path: '',
                component,
              },
            ],
          },
        ],
      },
    ])
    const match = router.routeMatch('/named-parent')

    expect(match?.name).toBe('namedGrandchild')
  })

  test('given route with simple string param WITHOUT value present, returns undefined', () => {
    const routes: Routes = [
      {
        name: 'simple-params',
        path: '/simple/:simple',
        component,
      },
    ]

    const router = createRouter(routes)
    const response = router.routeMatch('/simple/')

    expect(response).toBeUndefined()
  })
})