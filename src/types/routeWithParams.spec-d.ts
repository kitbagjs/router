import { expectTypeOf, test } from 'vitest'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { Route } from '@/types/route'
import { RouteGetByKey } from '@/types/routeWithParams'
import { routes } from '@/utilities/testHelpers'

test('CombineName returns correct keys for routes', () => {
  type Source = typeof routes[number]['key']
  type Expect = 'parentA' | 'parentB' | 'parentA.childA' | 'parentA.childA.grandChildA' | 'parentA.childB'

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('RouteGetByName works as expected', () => {
  type Source = RouteGetByKey<typeof routes, 'parentA'>
  type Expect = Route<'parentA', Path<'/:paramA', {}>, Query<'', {}>, false>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})