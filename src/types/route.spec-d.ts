import { describe, expectTypeOf, test } from 'vitest'
import { ExtractRouteParamTypesWriting, ExtractRouteParamTypesReading } from '@/types/params'
import { Route } from '@/types/route'
import { WithParams } from '@/services/withParams'
import { ParamGetSet } from './paramTypes'

describe('ExtractRouteParamTypes', () => {
  test('when reading/writing params, given routes with different params, some optional, no defaults, combines into expected args', () => {
    type TestRoute = Route<'parentA', WithParams<'https://[inHost].dev', {}>, WithParams<'/[inPath]', {}>, WithParams<'foo=[inQuery]&bar=[?paramC]', { inQuery: BooleanConstructor }>, WithParams<'[inHash]', {}>>

    type SourceWriting = ExtractRouteParamTypesWriting<TestRoute>
    type SourceReading = ExtractRouteParamTypesReading<TestRoute>
    type Expect = { inHost: string, inPath: string, paramC?: string, inQuery: boolean, inHash: string }

    expectTypeOf<SourceWriting>().toEqualTypeOf<Expect>()
    expectTypeOf<SourceReading>().toEqualTypeOf<Expect>()
  })

  test('when optional params have defaults, Reading and Writing change', () => {
    type TestRoute = Route<'parentA', WithParams<'https://kitbag.dev', {}>, WithParams<'/', {}>, WithParams<'foo=[required]&bar=[?optional]', { required: BooleanConstructor, optional: Required<ParamGetSet<string>> }>, WithParams<'', {}>>

    type SourceWriting = ExtractRouteParamTypesWriting<TestRoute>
    type SourceReading = ExtractRouteParamTypesReading<TestRoute>

    expectTypeOf<SourceWriting>().toEqualTypeOf<{ required: boolean, optional?: string | undefined }>()
    expectTypeOf<SourceReading>().toEqualTypeOf<{ required: boolean, optional: string }>()
  })
})
