import { expect, test } from 'vitest'
import { Routes } from '@/types'
import { resolveRoutes } from '@/utilities/resolveRoutes'
import { resolveRoutesRegex } from '@/utilities/resolveRoutesRegex'
import { routeMatch } from '@/utilities/routeMatch'
import { component } from '@/utilities/testHelpers'

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

  const resolved = resolveRoutes(routes)
  const resolvedWithRegex = resolveRoutesRegex(resolved)
  const match = routeMatch(resolvedWithRegex, '/parent/child/grandchild')

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

  const resolved = resolveRoutes(routes)
  const resolvedWithRegex = resolveRoutesRegex(resolved)
  const match = routeMatch(resolvedWithRegex, '/unnamed')

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

  const resolved = resolveRoutes(routes)
  const resolvedWithRegex = resolveRoutesRegex(resolved)
  const match = routeMatch(resolvedWithRegex, '/unnamed')

  expect(match?.name).toBe('unnamed-child-root')
})

test('given path that includes named parent and path to leaf, return first match', () => {
  const routes = [
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
  ] as const satisfies Routes

  const resolved = resolveRoutes(routes)
  const resolvedWithRegex = resolveRoutesRegex(resolved)
  const match = routeMatch(resolvedWithRegex, '/named-parent')

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

  const resolved = resolveRoutes(routes)
  const resolvedWithRegex = resolveRoutesRegex(resolved)
  const response = routeMatch(resolvedWithRegex, '/simple/')

  expect(response).toBeUndefined()
})