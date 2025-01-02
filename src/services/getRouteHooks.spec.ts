import { expect, test } from 'vitest'
import { getBeforeRouteHooksFromRoutes } from '@/services/getRouteHooks'
import { mockResolvedRoute, mockRoute } from '@/utilities/testHelpers'

test('given two ResolvedRoutes returns before timing hooks in correct order', () => {
  const grandchildA = mockRoute('grandchildA')
  const grandchildB = mockRoute('grandchildB')
  const childA = mockRoute('childA')
  const childB = mockRoute('childB')
  const parent = mockRoute('parentA')

  const to = mockResolvedRoute(grandchildB, [parent, childA, grandchildA])
  const from = mockResolvedRoute(grandchildA, [parent, childB, grandchildB])

  const hooks = getBeforeRouteHooksFromRoutes(to, from)

  expect(Array.from(hooks.onBeforeRouteEnter)).toMatchObject([childA.onBeforeRouteEnter, grandchildA.onBeforeRouteEnter])
  expect(Array.from(hooks.onBeforeRouteUpdate)).toMatchObject([parent.onBeforeRouteUpdate])
  expect(Array.from(hooks.onBeforeRouteChange)).toMatchObject([parent.onBeforeRouteChange, childA.onBeforeRouteChange, grandchildA.onBeforeRouteChange])
  expect(Array.from(hooks.onBeforeRouteLeave)).toMatchObject([childB.onBeforeRouteLeave, grandchildB.onBeforeRouteLeave])
})
