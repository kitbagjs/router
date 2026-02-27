import { Ref } from 'vue'
import { expectTypeOf, test } from 'vitest'
import { useQueryValue, withDefault } from '@/main'

test('value is Ref<string | null> when no param is provided', () => {
  const { value } = useQueryValue('foo')
  expectTypeOf(value).toEqualTypeOf<Ref<string | null>>()
})

test('value is Ref<T | null> when param has no default', () => {
  const { value } = useQueryValue('foo', Number)
  expectTypeOf(value).toEqualTypeOf<Ref<number | null>>()
})

test('value is Ref<T> (no null) when param has default', () => {
  const { value } = useQueryValue('foo', withDefault(Number, 3))
  expectTypeOf(value).toEqualTypeOf<Ref<number>>()
})

test('values is Ref<string[]> when no param is provided', () => {
  const { values } = useQueryValue('foo')
  expectTypeOf(values).toEqualTypeOf<Ref<string[]>>()
})

test('values is Ref<T[]> when param has no default', () => {
  const { values } = useQueryValue('foo', Number)
  expectTypeOf(values).toEqualTypeOf<Ref<number[]>>()
})

test('values is Ref<T[]> (no null) when param has default', () => {
  const { values } = useQueryValue('foo', withDefault(Number, 3))
  expectTypeOf(values).toEqualTypeOf<Ref<number[]>>()
})

test('remove is () => void', () => {
  const { remove } = useQueryValue('foo')
  expectTypeOf(remove).toEqualTypeOf<() => void>()
})
