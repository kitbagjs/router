import { expectTypeOf, test } from 'vitest'
import { withParams } from './withParams'
import { type } from 'arktype'
import { ExtractParamType } from '@/types/params'

test('withParams accepts arktype schemas', () => {
  const schema = type('string')
  const { params } = withParams('/[foo]', { foo: schema })

  expectTypeOf(params.foo).toEqualTypeOf<{ param: typeof schema, isOptional: false, isGreedy: false }>()
})

test('ExtractParamType returns the correct type for arktype params', () => {
  const param = type('boolean')
  type Input = ExtractParamType<typeof param>

  expectTypeOf<Input>().toEqualTypeOf<boolean>()
})
