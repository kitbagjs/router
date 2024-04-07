import { expectTypeOf, test } from 'vitest'
import { ExtractRouterRouteParamTypes, RouterRoute } from '@/types/routerRoute'
import { RouteGetByName, RouteWithParams } from '@/types/routeWithParams'
import { Path } from '@/utilities'
import { routes } from '@/utilities/testHelpers'

test('CombineName returns correct keys for routes', () => {
  type Source = typeof routes[number]['name']
  type Expect = 'parentA' | 'parentB' | 'parentA.childA' | 'parentA.childA.grandChildA' | 'parentA.childB'

  expectTypeOf<Source>().toMatchTypeOf<Expect>()
})

test('RouteGetByName works as expected', () => {
  type Source = RouteGetByName<typeof routes, 'parentA'>
  type Expect = RouterRoute<'parentA', Path<'/:paramA', {}>>

  expectTypeOf<Source>().toMatchTypeOf<Expect>()
})

test('ExtractRouterRouteParamTypes works as expected', () => {
  type Route = RouterRoute<'parentA', Path<'/:paramA', {}>>

  type Source = ExtractRouterRouteParamTypes<Route>
  type Expect = {
    route: 'parentA',
    params: { paramA: string },
  }

  expectTypeOf<Source>().toMatchTypeOf<Expect>()
})

test('RouteWithParams returns correct params for route', () => {
  type Source = RouteWithParams<typeof routes, 'parentA'>
  type Expect = {
    route: 'parentA',
    params: { paramA: string },
  }

  expectTypeOf<Source>().toMatchTypeOf<Expect>()
})