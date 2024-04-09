import { describe, expectTypeOf, test } from 'vitest'
import { RouterRoute } from '@/types/routerRoute'
import { RouteGetByName, RouteWithParams } from '@/types/routeWithParams'
import { Path, Query } from '@/utilities'
import { routes } from '@/utilities/testHelpers'

test('CombineName returns correct keys for routes', () => {
  type Source = typeof routes[number]['name']
  type Expect = 'parentA' | 'parentB' | 'parentA.childA' | 'parentA.childA.grandChildA' | 'parentA.childB'

  expectTypeOf<Source>().toMatchTypeOf<Expect>()
  expectTypeOf<Expect>().toMatchTypeOf<Source>()
})

test('RouteGetByName works as expected', () => {
  type Source = RouteGetByName<typeof routes, 'parentA'>
  type Expect = RouterRoute<'parentA', Path<'/:paramA', {}>, Query, false>

  expectTypeOf<Source>().toMatchTypeOf<Expect>()
  expectTypeOf<Expect>().toMatchTypeOf<Source>()
})

describe('RouteWithParams', () => {
  test('given valid route dot name, returns correct params for route', () => {
  type Source = RouteWithParams<typeof routes, 'parentA.childA.grandChildA'>
  type Expect = {
    route: 'parentA.childA.grandChildA',
    params: {
      paramA: string,
      paramB?: string | undefined,
      paramC: string,
    },
  }

  expectTypeOf<Source>().toMatchTypeOf<Expect>()
  expectTypeOf<Expect>().toMatchTypeOf<Source>()
  })

  test('given all optional params, does not require params property', () => {
  type Routes = [RouterRoute<'parentA', Path<'/:?paramA', {}>, Query<'foo=:?paramB&bar=:?paramC', { paramB: BooleanConstructor }>, false>]

  type Source = RouteWithParams<Routes, 'parentA'>
  type Expect = {
    route: 'parentA',
  }

  expectTypeOf<Source>().toMatchTypeOf<Expect>()
  expectTypeOf<Expect>().toMatchTypeOf<Source>()
  })

  test('given route that is disabled, returns never', () => {
  type Routes = [RouterRoute<'parentA', Path<'/:?paramA', {}>, Query<'foo=:?paramB&bar=:?paramC', { paramB: BooleanConstructor }>, true>]

  type Source = RouteWithParams<Routes, 'parentA'>
  type Expect = never

  expectTypeOf<Source>().toMatchTypeOf<Expect>()
  expectTypeOf<Expect>().toMatchTypeOf<Source>()
  })
})