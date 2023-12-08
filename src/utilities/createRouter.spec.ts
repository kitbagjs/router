import { describe, expect, test } from 'vitest'
import { Routes } from '@/types'
import { createRouter } from '@/utilities'

describe('router.routeMatch', () => {
  test('given path without params, returns unmodified regex', () => {
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
              },
            ],
          },
        ],
      },
    ] as const satisfies Routes

    const router = createRouter(routes)
    const matches = router.routeMatch('/parent/child/grandchild')

    expect(matches).toHaveLength(1)
    const [singleRoute] = matches
    expect(singleRoute.regex).toMatchObject(new RegExp('/parent/child/grandchild'))
  })

  test('given path to unnamed parent, without option to get to leaf, returns empty array', () => {
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
              },
            ],
          },
        ],
      },
    ] as const satisfies Routes

    const router = createRouter(routes)
    const matches = router.routeMatch('/unnamed')

    expect(matches).toHaveLength(0)
  })

  test('given path to unnamed  parent, with option to get to leaf, returns available leaf', () => {
    const routes = [
      {
        path: '/unnamed',
        children: [
          {
            name: 'unnamed-child-root',
            path: '',
          },
        ],
      },
    ] as const satisfies Routes
    const router = createRouter(routes)
    const matches = router.routeMatch('/unnamed')

    expect(matches).toHaveLength(1)
    const [singleRoute] = matches
    expect(singleRoute.name).toBe('unnamed-child-root')
  })

  test('given path that includes named parent and path to leaf, includes every named route parent the way', () => {
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
              },
            ],
          },
        ],
      },
    ])
    const matches = router.routeMatch('/named-parent')

    expect(matches.map(match => match.name)).toMatchObject(['namedGrandchild', 'namedChild', 'namedParent'])
  })
})