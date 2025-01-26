import { describe, expectTypeOf, test } from 'vitest'
import { ExtractRouteParamTypes } from '@/types/params'
import { Route } from '@/types/route'
import { EmptyWithParams, WithParams } from '@/services/withParams'

describe('ExtractRouteParamTypes', () => {
  test('given routes with different params, some optional, combines into expected args for developer', () => {
    type TestRoute = Route<'parentA', EmptyWithParams, WithParams<'/[paramA]', {}>, WithParams<'foo=[paramB]&bar=[?paramC]', { paramB: BooleanConstructor }>>

    type Source = ExtractRouteParamTypes<TestRoute>
    type Expect = { paramA: string, paramB: boolean, paramC?: string }

    expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })
})
