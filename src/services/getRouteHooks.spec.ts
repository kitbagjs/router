import { expect, test, vi } from 'vitest'
import { getBeforeRouteHooksFromRoutes } from '@/services/getRouteHooks'
import { createRoute } from './createRoute'
import { createResolvedRoute } from './createResolvedRoute'
import { asArray } from '@/utilities/array'

test('given two ResolvedRoutes returns before timing hooks in correct order', () => {
  const parent = {
    name: 'parentA',
    onBeforeRouteUpdate: [vi.fn()],
  }
  const routeParent = createRoute(parent)

  const childA = {
    name: 'childA',
    parent: routeParent,
    onBeforeRouteEnter: [vi.fn()],
    onBeforeRouteUpdate: [vi.fn()],
    onBeforeRouteLeave: [vi.fn()],
  }
  const routeChildA = createRoute(childA)

  const grandchildA = {
    name: 'grandchildA',
    parent: routeChildA,
    onBeforeRouteEnter: [vi.fn()],
    onBeforeRouteUpdate: [vi.fn()],
    onBeforeRouteLeave: [vi.fn()],
  }
  const routeGrandchildA = createRoute(grandchildA)

  const childB = {
    name: 'childB',
    parent: routeParent,
    onBeforeRouteEnter: [vi.fn()],
    onBeforeRouteUpdate: [vi.fn()],
    onBeforeRouteLeave: [vi.fn()],
  }
  const routeChildB = createRoute(childB)

  const grandchildB = {
    name: 'grandchildB',
    parent: routeChildB,
    onBeforeRouteEnter: [vi.fn()],
    onBeforeRouteUpdate: [vi.fn()],
    onBeforeRouteLeave: [vi.fn()],
  }
  const routeGrandchildB = createRoute(grandchildB)

  const to = createResolvedRoute(routeGrandchildA, {})
  const from = createResolvedRoute(routeGrandchildB, {})

  const hooks = getBeforeRouteHooksFromRoutes(to, from)

  expect(Array.from(hooks.onBeforeRouteEnter)).toMatchObject([...asArray(childA.onBeforeRouteEnter), ...asArray(grandchildA.onBeforeRouteEnter)])
  expect(Array.from(hooks.onBeforeRouteUpdate)).toMatchObject([...asArray(parent.onBeforeRouteUpdate)])
  expect(Array.from(hooks.onBeforeRouteLeave)).toMatchObject([...asArray(childB.onBeforeRouteLeave), ...asArray(grandchildB.onBeforeRouteLeave)])
})
