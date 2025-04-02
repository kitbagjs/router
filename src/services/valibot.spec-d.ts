import { expectTypeOf, test } from 'vitest'
import { withParams } from './withParams'
import { string } from 'valibot'

test('withParams accepts valibot schemas', () => {
  const schema = string()
  const { params } = withParams('/[foo]', { foo: schema })

  expectTypeOf(params.foo).toEqualTypeOf(schema)
})
