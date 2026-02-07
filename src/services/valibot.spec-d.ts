import { expectTypeOf, test } from 'vitest'
import { withParams } from './withParams'
import { string, boolean } from 'valibot'
import { ExtractParamType } from '@/types/params'

test('withParams accepts valibot schemas', () => {
  const schema = string()
  const { params } = withParams('/[foo]', { foo: schema })

  expectTypeOf(params.foo).toEqualTypeOf<[typeof schema, { isOptional: false, isGreedy: false }]>()
})

test('ExtractParamType returns the correct type for valibot params', () => {
  const param = boolean()
  type Input = ExtractParamType<typeof param>

  expectTypeOf<Input>().toEqualTypeOf<boolean>()
})
