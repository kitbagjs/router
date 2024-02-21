import { describe, expect, test, vi } from 'vitest'
import { createResolvedRouteQuery } from '.'
import { ResolvedRoute, Route } from '@/types'
import { createRouterRoutes } from '@/utilities/createRouterRoutes'
import { getRouteHooks, getRoutePath } from '@/utilities/routes'
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

describe('getRouteHooks', () => {
  test('given two ResolvedRoutes returns hooks in correct order', () => {
    const routeAChildA: Route = {
      name: 'routeAChildA',
      path: '/routeAChildA',
      component,
      onBeforeRouteEnter: vi.fn(),
      onBeforeRouteUpdate: vi.fn(),
      onBeforeRouteLeave: vi.fn(),
    }

    const routeAChildB: Route = {
      name: 'routeAChildB',
      path: '/routeAChildB',
      component,
      onBeforeRouteEnter: vi.fn(),
      onBeforeRouteUpdate: vi.fn(),
      onBeforeRouteLeave: vi.fn(),
    }

    const routeAParent: Route = {
      name: 'routeAParent',
      path: '/routeAParent',
      children: [routeAChildA, routeAChildB],
      onBeforeRouteEnter: vi.fn(),
      onBeforeRouteUpdate: vi.fn(),
      onBeforeRouteLeave: vi.fn(),
    }

    const routeBChild: Route = {
      name: 'routeBChild',
      path: '/routeBChild',
      component,
      onBeforeRouteEnter: vi.fn(),
      onBeforeRouteUpdate: vi.fn(),
      onBeforeRouteLeave: vi.fn(),
    }

    const routeBParent: Route = {
      name: 'routeBParent',
      path: '/routeBParent',
      children: [routeBChild],
      onBeforeRouteEnter: vi.fn(),
      onBeforeRouteUpdate: vi.fn(),
      onBeforeRouteLeave: vi.fn(),
    }

    const resolvedRouteAParent: ResolvedRoute = {
      matched: routeAParent,
      matches: [routeAParent, routeAChildA],
      name: '',
      query: createResolvedRouteQuery(),
      params: {},
    }

    const resolvedRouteBParent: ResolvedRoute = {
      matched: routeBParent,
      matches: [routeBParent, routeBChild],
      name: '',
      query: createResolvedRouteQuery(),
      params: {},
    }

    const hooks = getRouteHooks(resolvedRouteAParent, resolvedRouteBParent, 'before')

    expect(hooks).toMatchObject([
      routeBParent.onBeforeRouteLeave,
      routeBChild.onBeforeRouteLeave,
      routeAParent.onBeforeRouteEnter,
      routeAChildA.onBeforeRouteEnter,
    ])

    const resolvedRouteAParentChildA: ResolvedRoute = {
      matched: routeAChildA,
      matches: [routeAParent, routeAChildA],
      name: '',
      query: createResolvedRouteQuery(),
      params: {},
    }

    const resolvedRouteAParentChildB: ResolvedRoute = {
      matched: routeAChildB,
      matches: [routeAParent, routeAChildB],
      name: '',
      query: createResolvedRouteQuery(),
      params: {},
    }

    const hooksB = getRouteHooks(resolvedRouteAParentChildA, resolvedRouteAParentChildB, 'before')

    expect(hooksB).toMatchObject([
      routeAChildB.onBeforeRouteLeave,
      routeAParent.onBeforeRouteUpdate,
      routeAChildA.onBeforeRouteEnter,
    ])
  })
})