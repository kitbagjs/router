import { expectTypeOf, test } from 'vitest'
import { Hash } from '@/types/hash'
import { Host } from '@/types/host'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { Route } from '@/types/route'
import { RouteGetByKey } from '@/types/routeWithParams'
import { routes } from '@/utilities/testHelpers'
import { RouteMeta } from '@/types/register'
import { Param } from '@/types/paramTypes'
import { CreateRouteOptions } from '@/types/createRouteOptions'

test('RouteGetByName works as expected', () => {
  type Source = RouteGetByKey<typeof routes, 'parentA'>
  type Matched = CreateRouteOptions<'parentA', '/parentA/[paramA]', undefined, undefined>
  type Expect = Route<'parentA', Host<'', {}>, Path<'/parentA/[paramA]', {}>, Query<'', {}>, Hash<''>, RouteMeta, Record<string, Param>, Matched, [Matched]>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})
