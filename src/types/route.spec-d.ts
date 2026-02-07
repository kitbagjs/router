import { describe, expectTypeOf, test } from 'vitest'
import { withParams } from '@/services/withParams'
import { withDefault } from '@/services/withDefault'
import { createRoute } from '@/services/createRoute'
import { createExternalRoute } from '@/services/createExternalRoute'
import { UrlParamsReading, UrlParamsWriting } from '@/types/url'

describe('ExtractRouteParamTypes', () => {
  test('when reading/writing params, given routes with different params, some optional, no defaults, combines into expected args', () => {
    const testRoute = createExternalRoute({
      name: 'parentA',
      host: 'https://[inHost].dev',
      path: '/[inPath]',
      query: withParams('foo=[inQuery]&bar=[?paramC]', {
        inQuery: Boolean,
      }),
      hash: '[inHash]',
    })

    type TestRoute = typeof testRoute

    type SourceWriting = UrlParamsWriting<TestRoute>
    type SourceReading = UrlParamsReading<TestRoute>
    type Expect = { inHost: string, inPath: string, paramC?: string, inQuery: boolean, inHash: string }

    expectTypeOf<SourceWriting>().toEqualTypeOf<Expect>()
    expectTypeOf<SourceReading>().toEqualTypeOf<Expect>()
  })

  test('when optional params have defaults, Reading and Writing change', () => {
    const testRoute = createRoute({
      name: 'parentA',
      host: 'https://kitbag.dev',
      path: '/',
      query: withParams('foo=[required]&bar=[?optional]', {
        required: Boolean,
        optional: withDefault(String, 'ABC'),
      }),
    })
    type TestRoute = typeof testRoute

    type SourceWriting = UrlParamsWriting<TestRoute>
    type SourceReading = UrlParamsReading<TestRoute>

    expectTypeOf<SourceWriting>().toEqualTypeOf<{ required: boolean, optional?: string | undefined }>()
    expectTypeOf<SourceReading>().toEqualTypeOf<{ required: boolean, optional: string }>()
  })
})
