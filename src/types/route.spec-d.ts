import { describe, expectTypeOf, test } from 'vitest'
import { ExtractRouteParamTypes, Route } from '@/types/route'
import { Path, Query } from '@/utilities'

describe('ExtractRouteParamTypes', () => {
  test('given routes with different params, some optional, combines into expected args for developer', () => {
    type TestRoute = Route<'parentA', Path<'/:paramA', {}>, Query<'foo=:paramB&bar=:?paramC', { paramB: BooleanConstructor }>>

    type Source = ExtractRouteParamTypes<TestRoute>
    type Expect = { paramA: string, paramB: boolean, paramC?: string }

    expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })
})