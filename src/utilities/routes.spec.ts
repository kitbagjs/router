import { describe, expect, test } from 'vitest'
import { Route } from '@/types'
import { resolveRoutes } from '@/utilities/resolveRoutes'
import { getRoutePath } from '@/utilities/routes'
import { component } from '@/utilities/testHelpers'

describe('getRoutePath', () => {

  test('given no public routes, returns empty string', () => {
    const child = {
      name: 'child',
      path: '/child',
      component,
    } as const satisfies Route

    const parent = {
      name: 'parent',
      path: '/parent',
      children: [child],
    } as const satisfies Route

    const grandparent = {
      name: 'grandparent',
      path: '/grandparent',
      children: [parent],
    } as const satisfies Route

    const [resolved] = resolveRoutes([grandparent])
    const flattened = getRoutePath(resolved)

    expect(flattened).toBe('grandparent.parent.child')
  })

})
