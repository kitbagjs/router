import { describe, expectTypeOf, test } from 'vitest'
import { ExtractRouteParamTypesWithOptional } from '@/types/params'
import { Route } from '@/types/route'
import { WithParams } from '@/services/withParams'

describe('ExtractRouteParamTypes', () => {
  test('given routes with different params, some optional, combines into expected args for developer', () => {
    type TestRoute = Route<'parentA', WithParams<'https://[inHost].dev', {}>, WithParams<'/[inPath]', {}>, WithParams<'foo=[inQuery]&bar=[?paramC]', { inQuery: BooleanConstructor }>, WithParams<'[inHash]', {}>>

    type Source = ExtractRouteParamTypesWithOptional<TestRoute>
    type Expect = { inHost: string, inPath: string, paramC?: string, inQuery: boolean, inHash: string }

    expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })
})
