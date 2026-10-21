import { ComputedRef } from 'vue'
import { expectTypeOf, test } from 'vitest'
import { createParam, useParam, literal, withDefault } from '@/main'

test('param value types are preserved in readonly computed refs', () => {
  const { value, values } = useParam(createParam(Number))

  expectTypeOf(value).toEqualTypeOf<ComputedRef<number | undefined>>()
  expectTypeOf(values).toEqualTypeOf<ComputedRef<number[]>>()

  // @ts-expect-error param refs are readonly
  value.value = 1
  // @ts-expect-error param collection refs are readonly
  values.value = [1]

  const status = useParam(literal('active'))

  expectTypeOf(status.value).toEqualTypeOf<ComputedRef<'active' | undefined>>()
  expectTypeOf(status.values).toEqualTypeOf<ComputedRef<'active'[]>>()
})

test('defaulted params can still be absent from the current route', () => {
  const { value, values } = useParam(withDefault(Number, 3))

  expectTypeOf(value).toEqualTypeOf<ComputedRef<number | undefined>>()
  expectTypeOf(values).toEqualTypeOf<ComputedRef<number[]>>()
})

test('lookup requires a param definition', () => {
  // @ts-expect-error lookup requires a param definition
  useParam(Number)
})
