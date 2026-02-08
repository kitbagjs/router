import { expectTypeOf, test, describe } from 'vitest'
import { ToUrlPart, UrlPart, withParams } from '@/services/withParams'

test('given a string without params, expects no params', () => {
  const source = withParams('/something-without-params', {})

  type Source = typeof source
  type Expect = UrlPart<{}>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('given a string with required params NOT assigned, uses string constructor', () => {
  const source = withParams('/something-with-[param]', {})

  type Source = typeof source
  type Expect = UrlPart<{ param: { param: StringConstructor, isOptional: false, isGreedy: false } }>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('given a string with required params assigned, uses passed in Type', () => {
  const source = withParams('/something-with-[param]', { param: Boolean })

  type Source = typeof source
  type Expect = UrlPart<{ param: { param: BooleanConstructor, isOptional: false, isGreedy: false } }>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

describe('ToUrlPart', () => {
  test('given a string, returns ToUrlPart with that string and empty params', () => {
    type Source = ToUrlPart<'test'>
    type Expect = UrlPart<{}>

    expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('given undefined, returns ToUrlPart with empty string', () => {
    type Source = ToUrlPart<undefined>
    type Expect = UrlPart<{}>

    expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('given a ToUrlPart type, returns the same type', () => {
    type Source = ToUrlPart<UrlPart<{ foo: { param: NumberConstructor, isOptional: false, isGreedy: false } }>>
    type Expect = UrlPart<{ foo: { param: NumberConstructor, isOptional: false, isGreedy: false } }>

    expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })
})
