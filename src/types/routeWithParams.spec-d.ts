import { expectTypeOf, test } from 'vitest'
import { Host } from '@/types/host'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { Route } from '@/types/route'
import { RouteGetByKey } from '@/types/routeWithParams'
import { routes } from '@/utilities/testHelpers'

test('CombineKey returns correct keys for routes', () => {
  type Source = typeof routes[number]['key']
  type Expect = 'parentA' | 'parentB' | 'parentA.childA' | 'parentA.childA.grandChildA' | 'parentA.childB' | 'parentC'

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('RouteGetByName works as expected', () => {
  type Source = RouteGetByKey<typeof routes, 'parentA'>
  type Expect = Route<'parentA', Host<'', {}>, Path<'/parentA/[paramA]', {}>, Query<'', {}>>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})
