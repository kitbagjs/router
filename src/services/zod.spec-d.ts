import { expectTypeOf, test } from 'vitest'
import { withParams } from './withParams'
import { z } from 'zod'
import { ExtractParamType } from '@/types/params'

test('withParams accepts zod schemas', () => {
  const schema = z.string()
  const { params } = withParams('/[foo]', { foo: schema })

  expectTypeOf(params.foo).toEqualTypeOf<{ param: typeof schema, isOptional: false, isGreedy: false }>()
})

test('ExtractParamType returns the correct type for zod params', () => {
  const param = z.boolean()
  type Input = ExtractParamType<typeof param>

  expectTypeOf<Input>().toEqualTypeOf<boolean>()
})

test('ExtractParamType makes defaulted collections required in the output', () => {
  const schema = z.object({
    values: z.array(z.string()).default(() => []),
    meta: z.record(z.string(), z.unknown()).default(() => ({})),
  })

  expectTypeOf<ExtractParamType<typeof schema>>().toEqualTypeOf<{ values: string[], meta: Record<string, unknown> }>()
})

test('ExtractParamType preserves required and optional tuple elements', () => {
  const required = z.tuple([z.string(), z.number()])
  const optional = z.tuple([z.string().optional(), z.number().optional()])

  expectTypeOf<ExtractParamType<typeof required>>().toEqualTypeOf<[string, number]>()
  expectTypeOf<ExtractParamType<typeof optional>>().toEqualTypeOf<[string?, number?]>()
})
