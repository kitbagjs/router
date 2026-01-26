import { expect, test, vi } from 'vitest'
import { getBeforeHooksFromRoutes } from '@/services/getRouteHooks'
import { createRoute } from './createRoute'
import { createResolvedRoute } from './createResolvedRoute'

test('given two ResolvedRoutes returns before timing hooks in correct order', () => {
  const parent = createRoute({
    name: 'parentA',
  })

  parent.onBeforeRouteUpdate(vi.fn())

  const childA = createRoute({
    name: 'childA',
    parent: parent,
  })

  childA.onBeforeRouteEnter(vi.fn())
  childA.onBeforeRouteUpdate(vi.fn())
  childA.onBeforeRouteLeave(vi.fn())

  const grandchildA = createRoute({
    name: 'grandchildA',
    parent: childA,
  })

  grandchildA.onBeforeRouteEnter(vi.fn())
  grandchildA.onBeforeRouteUpdate(vi.fn())
  grandchildA.onBeforeRouteLeave(vi.fn())

  const childB = createRoute({
    name: 'childB',
    parent: parent,
  })

  childB.onBeforeRouteEnter(vi.fn())
  childB.onBeforeRouteUpdate(vi.fn())
  childB.onBeforeRouteLeave(vi.fn())

  const grandchildB = createRoute({
    name: 'grandchildB',
    parent: childB,
  })

  grandchildB.onBeforeRouteEnter(vi.fn())
  grandchildB.onBeforeRouteUpdate(vi.fn())
  grandchildB.onBeforeRouteLeave(vi.fn())

  const to = createResolvedRoute(grandchildA, {})
  const from = createResolvedRoute(grandchildB, {})

  const hooks = getBeforeHooksFromRoutes(to, from)

  expect(Array.from(hooks.onBeforeRouteEnter)).toMatchObject([...Array.from(childA.hooks.at(-1)?.onBeforeRouteEnter ?? []), ...Array.from(grandchildA.hooks.at(-1)?.onBeforeRouteEnter ?? [])])
  expect(Array.from(hooks.onBeforeRouteUpdate)).toMatchObject([...Array.from(parent.hooks.at(-1)?.onBeforeRouteUpdate ?? [])])
  expect(Array.from(hooks.onBeforeRouteLeave)).toMatchObject([...Array.from(childB.hooks.at(-1)?.onBeforeRouteLeave ?? []), ...Array.from(grandchildB.hooks.at(-1)?.onBeforeRouteLeave ?? [])])
})
