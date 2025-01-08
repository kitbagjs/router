import { expectTypeOf, test } from 'vitest'
import { Hash } from '@/types/hash'
import { Host } from '@/types/host'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { CreatedRouteOptions, Route } from '@/types/route'
import { RouteGetByKey } from '@/types/routeWithParams'
import { routes } from '@/utilities/testHelpers'
import { RouteMeta } from '@/types/register'
import { Param } from '@/types/paramTypes'

test('RouteGetByName works as expected', () => {
  type Source = RouteGetByKey<typeof routes, 'parentA'>
  type Matched = CreatedRouteOptions & {
    readonly name: 'parentA',
    readonly path: '/parentA/[paramA]',
  }
  type Expect = Route<'parentA', Host<'', {}>, Path<'/parentA/[paramA]', {}>, Query<'', {}>, Hash<''>, RouteMeta, Record<string, Param>, [Matched]>
  expectTypeOf<Source['path']>().toEqualTypeOf<Expect['path']>()

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})
