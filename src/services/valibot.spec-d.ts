import { expectTypeOf, test } from 'vitest'
import { withParams } from './withParams'
import * as v from 'valibot'
import { ExtractParamType } from '@/types/params'

test('withParams accepts valibot schemas', () => {
  const schema = v.string()
  const { params } = withParams('/[foo]', { foo: schema })

  expectTypeOf(params.foo).toEqualTypeOf<{ param: typeof schema, isOptional: false, isGreedy: false }>()
})

test('ExtractParamType returns the correct type for valibot params', () => {
  const param = v.boolean()
  type Input = ExtractParamType<typeof param>

  expectTypeOf<Input>().toEqualTypeOf<boolean>()
})

test('ExtractParamType makes defaulted collections required in the output', () => {
  const schema = v.object({
    values: v.optional(v.array(v.string()), () => []),
    meta: v.optional(v.record(v.string(), v.unknown()), () => ({})),
  })

  expectTypeOf<ExtractParamType<typeof schema>>().toEqualTypeOf<{ values: string[], meta: Record<string, unknown> }>()
})

test('ExtractParamType preserves required and optional tuple elements', () => {
  const required = v.tuple([v.string(), v.number()])
  const optional = v.tuple([v.optional(v.string()), v.optional(v.number())])

  expectTypeOf<ExtractParamType<typeof required>>().toEqualTypeOf<[string, number]>()
  expectTypeOf<ExtractParamType<typeof optional>>().toEqualTypeOf<[string | undefined, number | undefined]>()
})
