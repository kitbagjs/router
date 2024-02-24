import { expect, test, vi } from 'vitest'
import { ResolvedRoute } from '@/types/resolved'
import { Route } from '@/types/routes'
import { createResolvedRouteQuery } from '@/utilities/createResolvedRouteQuery'
import { getRouteHooks } from '@/utilities/getRouteHooks'
import { component } from '@/utilities/testHelpers'

function mockRoute(name: string): Route {
  return {
    name,
    path: `/${name}`,
    component,
    onBeforeRouteEnter: vi.fn(),
    onBeforeRouteUpdate: vi.fn(),
    onBeforeRouteLeave: vi.fn(),
  }
}

function mockResolvedRoute(matched: Route, matches: Route[]): ResolvedRoute {
  return {
    matched,
    matches,
    name: matched.name!,
    query: createResolvedRouteQuery(),
    params: {},
  }
}

test('given two ResolvedRoutes returns before timing hooks in correct order', () => {
  const grandchildA = mockRoute('grandchildA')
  const grandchildB = mockRoute('grandchildB')
  const childA = mockRoute('childA')
  const childB = mockRoute('childB')
  const parent = mockRoute('parentA')

  const to = mockResolvedRoute(grandchildB, [parent, childA, grandchildA])
  const from = mockResolvedRoute(grandchildA, [parent, childB, grandchildB])

  const hooks = getRouteHooks(to, from, 'before')

  expect(hooks).toMatchObject([
    childB.onBeforeRouteLeave,
    grandchildB.onBeforeRouteLeave,
    parent.onBeforeRouteUpdate,
    childA.onBeforeRouteEnter,
    grandchildA.onBeforeRouteEnter,
  ])
})