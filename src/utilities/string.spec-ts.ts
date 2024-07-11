import { describe, expectTypeOf, test } from 'vitest'
import { StringHasValue } from '@/utilities/string'

describe('given empty string, returns false', () => {
  type Source = StringHasValue<''>
  type Expect = false

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

describe('given generic string, returns true', () => {
  type Source = StringHasValue<string>
  type Expect = true

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

describe('given type any, returns true', () => {
  type Source = StringHasValue<any>
  type Expect = true

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

describe('given type other than string or any, returns false', () => {
  type Source = StringHasValue<undefined>
  type Expect = false

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

describe('given string not empty, returns true', () => {
  type Source = StringHasValue<'foo'>
  type Expect = true

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})