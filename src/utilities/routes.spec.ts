import { describe, expect, test } from 'vitest'
import { Route } from '@/types'
import { createRouterRoutes } from '@/utilities/createRouterRoutes'
import { getRoutePath } from '@/utilities/routes'
import { component } from '@/utilities/testHelpers'

describe('getRoutePath', () => {

  test('given named routes, returns string of each route name', () => {
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

    const [routerRoutes] = createRouterRoutes([grandparent])
    const flattened = getRoutePath(routerRoutes)

    expect(flattened).toBe('grandparent.parent.child')
  })

  test('given parents without names, returns only the leaf', () => {
    const child = {
      name: 'child',
      path: '/child',
      component,
    } as const satisfies Route

    const parent = {
      path: '/parent',
      children: [child],
    } as const satisfies Route

    const grandparent = {
      path: '/grandparent',
      children: [parent],
    } as const satisfies Route

    const [routerRoutes] = createRouterRoutes([grandparent])
    const flattened = getRoutePath(routerRoutes)

    expect(flattened).toBe('child')
  })

})