import { expect, test, vi } from 'vitest'
import { getBeforeRouteHooksFromRoutes } from '@/services/getRouteHooks'
import { createRoute } from './createRoute'
import { createResolvedRoute } from './createResolvedRoute'

test('given two ResolvedRoutes returns before timing hooks in correct order', () => {
  const parent = createRoute({
    name: 'parentA',
    onBeforeRouteUpdate: [vi.fn()],
  })

  const childA = createRoute({
    name: 'childA',
    parent: parent,
    onBeforeRouteEnter: [vi.fn()],
    onBeforeRouteUpdate: [vi.fn()],
    onBeforeRouteLeave: [vi.fn()],
  })

  const grandchildA = createRoute({
    name: 'grandchildA',
    parent: childA,
    onBeforeRouteEnter: [vi.fn()],
    onBeforeRouteUpdate: [vi.fn()],
    onBeforeRouteLeave: [vi.fn()],
  })

  const childB = createRoute({
    name: 'childB',
    parent: parent,
    onBeforeRouteEnter: [vi.fn()],
    onBeforeRouteUpdate: [vi.fn()],
    onBeforeRouteLeave: [vi.fn()],
  })

  const grandchildB = createRoute({
    name: 'grandchildB',
    parent: childB,
    onBeforeRouteEnter: [vi.fn()],
    onBeforeRouteUpdate: [vi.fn()],
    onBeforeRouteLeave: [vi.fn()],
  })

  const to = createResolvedRoute(grandchildA, {})
  const from = createResolvedRoute(grandchildB, {})

  const hooks = getBeforeRouteHooksFromRoutes(to, from)

  expect(Array.from(hooks.onBeforeRouteEnter)).toMatchObject([...Array.from(childA.hooks.at(0)?.onBeforeRouteEnter ?? []), ...Array.from(grandchildA.hooks.at(0)?.onBeforeRouteEnter ?? [])])
  expect(Array.from(hooks.onBeforeRouteUpdate)).toMatchObject([...Array.from(parent.hooks.at(0)?.onBeforeRouteUpdate ?? [])])
  expect(Array.from(hooks.onBeforeRouteLeave)).toMatchObject([...Array.from(childB.hooks.at(0)?.onBeforeRouteLeave ?? []), ...Array.from(grandchildB.hooks.at(0)?.onBeforeRouteLeave ?? [])])
})
