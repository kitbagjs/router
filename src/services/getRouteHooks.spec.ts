import { expect, test } from 'vitest'
import { getBeforeRouteHooksFromRoutes } from '@/services/getRouteHooks'
import { mockResolvedRoute, mockRoute } from '@/utilities/testHelpers'
import { asArray } from '@/utilities/array'

test('given two ResolvedRoutes returns before timing hooks in correct order', () => {
  const grandchildA = mockRoute('grandchildA')
  const grandchildB = mockRoute('grandchildB')
  const childA = mockRoute('childA')
  const childB = mockRoute('childB')
  const parent = mockRoute('parentA')

  const to = mockResolvedRoute(grandchildB, [parent, childA, grandchildA])
  const from = mockResolvedRoute(grandchildA, [parent, childB, grandchildB])

  const hooks = getBeforeRouteHooksFromRoutes(to, from)

  expect(Array.from(hooks.onBeforeRouteEnter)).toMatchObject([...asArray(childA.onBeforeRouteEnter ?? []), ...asArray(grandchildA.onBeforeRouteEnter ?? [])])
  expect(Array.from(hooks.onBeforeRouteUpdate)).toMatchObject([...asArray(parent.onBeforeRouteUpdate ?? [])])
  expect(Array.from(hooks.onBeforeRouteLeave)).toMatchObject([...asArray(childB.onBeforeRouteLeave ?? []), ...asArray(grandchildB.onBeforeRouteLeave ?? [])])
})
