import { expectTypeOf, test } from 'vitest'
import { ExtractRouterRouteParamTypes, RouterRoute } from '@/types/routerRoute'
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
  type Expect = RouterRoute<'parentA', Path<'/:paramA', {}>>

  expectTypeOf<Source>().toMatchTypeOf<Expect>()
  expectTypeOf<Expect>().toMatchTypeOf<Source>()
})

test('ExtractRouterRouteParamTypes works as expected', () => {
  type Route = RouterRoute<'parentA', Path<'/:paramA', {}>, Query<'foo=:paramB&bar=:?paramC', { paramB: BooleanConstructor }>>

  type Source = ExtractRouterRouteParamTypes<Route>
  type Expect = { paramA: string, paramB: boolean, paramC?: string }

  expectTypeOf<Source>().toMatchTypeOf<Expect>()
  expectTypeOf<Expect>().toMatchTypeOf<Source>()
})

test('RouteWithParams returns correct params for route', () => {
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

test('RouteWithParams given all optional params, does not require params property', () => {
  type Routes = [RouterRoute<'parentA', Path<'/:?paramA', {}>, Query<'foo=:?paramB&bar=:?paramC', { paramB: BooleanConstructor }>>]

  type Source = RouteWithParams<Routes, 'parentA'>
  type Expect = {
    route: 'parentA',
  }

  expectTypeOf<Source>().toMatchTypeOf<Expect>()
  expectTypeOf<Expect>().toMatchTypeOf<Source>()
})