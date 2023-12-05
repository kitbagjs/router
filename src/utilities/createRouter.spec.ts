import { describe, expect, test } from 'vitest'
import { Routes } from '@/types'
import { createRouter } from '@/utilities'

const routes = [
  {
    name: 'parent',
    path: '/parent1',
    children: [
      {
        name: 'child',
        path: '/:child',
        children: [
          {
            name: 'grandchild',
            path: '/:grandchild',
          },
        ],
      },
    ],
  },
  {
    name: 'parent2',
    path: '/parent2',
    children: [
      {
        name: 'root',
        path: '',
      },
      {
        name: 'child2',
        path: '/child',
      },
      {
        name: 'child3',
        path: '/child3',
      },
    ],
  },
] as const satisfies Routes

describe('router.routeMatch', () => {
  test('given path without params, returns matching RouteFlat', () => {
    const router = createRouter(routes)
    const match = router.routeMatch('/parent2/child')

    expect(match).toMatchObject([
      {
        name: 'child2',
        path: '/parent2/child',
        regex: new RegExp('/parent2/child'),
      },
    ])
  })

  test('given path to parent, without option to get to leaf, returns empty array', () => {
    const router = createRouter(routes)
    const match = router.routeMatch('/parent1')

    expect(match).toHaveLength(0)
  })

  test('given path to parent, with option to get to leaf, returns available leaf', () => {
    const router = createRouter(routes)
    const match = router.routeMatch('/parent2')

    expect(match).toMatchObject([
      {
        name: 'root',
        path: '/parent2',
        regex: new RegExp('/parent2'),
      },
    ])
  })
})