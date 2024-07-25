import { describe, expectTypeOf, test } from 'vitest'
import { Host } from '@/types/host'
import { ExtractRouteParamTypes } from '@/types/params'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { Route } from '@/types/route'

describe('ExtractRouteParamTypes', () => {
  test('given routes with different params, some optional, combines into expected args for developer', () => {
    type TestRoute = Route<'parentA', Host<'', {}>, Path<'/[paramA]', {}>, Query<'foo=[paramB]&bar=[?paramC]', { paramB: BooleanConstructor }>>

    type Source = ExtractRouteParamTypes<TestRoute>
    type Expect = { paramA: string, paramB: boolean, paramC?: string }

    expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })
})