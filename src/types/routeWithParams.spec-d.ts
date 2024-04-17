import { expectTypeOf, test } from 'vitest'
import { RouterRoute } from '@/types/routerRoute'
import { RouteGetByName } from '@/types/routeWithParams'
import { Path, Query } from '@/utilities'
import { routes } from '@/utilities/testHelpers'

test('CombineName returns correct keys for routes', () => {
  type Source = typeof routes[number]['name']
  type Expect = 'parentA' | 'parentB' | 'parentA.childA' | 'parentA.childA.grandChildA' | 'parentA.childB'

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('RouteGetByName works as expected', () => {
  type Source = RouteGetByName<typeof routes, 'parentA'>
  type Expect = RouterRoute<'parentA', Path<'/:paramA', {}>, Query<'', {}>, false>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})