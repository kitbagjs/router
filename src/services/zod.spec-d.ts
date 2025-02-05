import { expectTypeOf, test } from "vitest"
import { withParams } from "./withParams"
import { z } from "zod"

test('withParams accepts zod schemas', () => {
  const schema = z.string()
  const { params } = withParams('/[foo]', { foo: schema })

  expectTypeOf(params.foo).toEqualTypeOf(schema)
})