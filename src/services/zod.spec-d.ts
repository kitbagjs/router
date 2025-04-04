import { expectTypeOf, test } from 'vitest'
import { withParams } from './withParams'
import { z } from 'zod'
import { ExtractParamType } from '@/types/params'

test('withParams accepts zod schemas', () => {
  const schema = z.string()
  const { params } = withParams('/[foo]', { foo: schema })

  expectTypeOf(params.foo).toEqualTypeOf(schema)
})

test('ExtractParamType returns the correct type for zod params', () => {
  const param = z.boolean()
  type Input = ExtractParamType<typeof param>

  expectTypeOf<Input>().toEqualTypeOf<boolean>()
})
