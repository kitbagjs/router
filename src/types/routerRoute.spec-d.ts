import { describe, expectTypeOf, test } from 'vitest'
import { ExtractRouterRouteParamTypes, RouterRoute } from '@/types/routerRoute'
import { Path, Query } from '@/utilities'

describe('ExtractRouterRouteParamTypes', () => {
  test('given routes with different params, some optional, combines into expected args for developer', () => {
  type Route = RouterRoute<'parentA', Path<'/:paramA', {}>, Query<'foo=:paramB&bar=:?paramC', { paramB: BooleanConstructor }>>

  type Source = ExtractRouterRouteParamTypes<Route>
  type Expect = { paramA: string, paramB: boolean, paramC?: string }

  expectTypeOf<Source>().toMatchTypeOf<Expect>()
  expectTypeOf<Expect>().toMatchTypeOf<Source>()
  })
})