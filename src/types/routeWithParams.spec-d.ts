import { expectTypeOf, test } from 'vitest'
import { Route } from '@/types/routerRoute'
import { RouteGetByName } from '@/types/routeWithParams'
import { Path, Query } from '@/utilities'
import { routeProps } from '@/utilities/testHelpers'

test('CombineName returns correct keys for routes', () => {
  type Source = typeof routeProps[number]['name']
  type Expect = 'parentA' | 'parentB' | 'parentA.childA' | 'parentA.childA.grandChildA' | 'parentA.childB'

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('RouteGetByName works as expected', () => {
  type Source = RouteGetByName<typeof routeProps, 'parentA'>
  type Expect = Route<'parentA', Path<'/:paramA', {}>, Query<'', {}>, false>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})