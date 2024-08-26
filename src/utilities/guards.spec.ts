import { describe, expect, expectTypeOf, test } from 'vitest'
import { hasProperty, StringHasValue } from '@/utilities/guards'

describe('hasProperty', () => {

  test('returns true when property exists', () => {
    const source = hasProperty({ foo: true }, 'foo')

    expect(source).toBe(true)
  })

  test('returns false when property does not exists', () => {
    const source = hasProperty({}, 'foo')

    expect(source).toBe(false)
  })

  test('returns true when property exists and is correct type', () => {
    const source = hasProperty({ foo: true }, 'foo', Boolean)

    expect(source).toBe(true)
  })

  test('returns false when property exists and is not correct type', () => {
    const source = hasProperty({ foo: true }, 'foo', String)

    expect(source).toBe(false)
  })

})

describe('stringHasValue', () => {
  test('given empty string, returns false', () => {
  type Source = StringHasValue<''>
  type Expect = false

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('given generic string, returns true', () => {
  type Source = StringHasValue<string>
  type Expect = true

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('given type any, returns true', () => {
  type Source = StringHasValue<any>
  type Expect = true

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('given type other than string or any, returns false', () => {
  type Source = StringHasValue<undefined>
  type Expect = false

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('given string not empty, returns true', () => {
  type Source = StringHasValue<'foo'>
  type Expect = true

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })
})