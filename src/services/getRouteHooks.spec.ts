import { expect, test } from 'vitest'
import { getBeforeRouteHooksFromRoutes } from '@/services/getRouteHooks'
import { createRoute } from './createRoute'
import { createResolvedRoute } from './createResolvedRoute'

test('given two ResolvedRoutes returns before timing hooks in correct order', () => {
  const parent = createRoute({ name: 'parentA' })
  const childA = createRoute({ name: 'childA', parent })
  const grandchildA = createRoute({ name: 'grandchildA', parent: childA })
  const childB = createRoute({ name: 'childB', parent })
  const grandchildB = createRoute({ name: 'grandchildB', parent: childA })

  const to = createResolvedRoute(grandchildB, {})
  const from = createResolvedRoute(grandchildA, {})

  const hooks = getBeforeRouteHooksFromRoutes(to, from)
  expect(Array.from(hooks.onBeforeRouteEnter)).toMatchObject([...Array.from(childA.stores.at(0)?.onBeforeRouteEnter ?? []), ...Array.from(grandchildA.stores.at(0)?.onBeforeRouteEnter ?? [])])
  expect(Array.from(hooks.onBeforeRouteUpdate)).toMatchObject([...Array.from(parent.stores.at(0)?.onBeforeRouteUpdate ?? [])])
  expect(Array.from(hooks.onBeforeRouteLeave)).toMatchObject([...Array.from(childB.stores.at(0)?.onBeforeRouteLeave ?? []), ...Array.from(grandchildB.stores.at(0)?.onBeforeRouteLeave ?? [])])
})
