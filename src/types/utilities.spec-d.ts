import { expectTypeOf, test } from 'vitest'
import { LastInArray } from '@/types/utilities'

test('LastInArray infers the last tuple element or the element type of an array', () => {
  expectTypeOf<LastInArray<[string, number]>>().toEqualTypeOf<number>()
  expectTypeOf<LastInArray<string[]>>().toEqualTypeOf<string>()
  expectTypeOf<LastInArray<[]>>().toEqualTypeOf<never>()
})
