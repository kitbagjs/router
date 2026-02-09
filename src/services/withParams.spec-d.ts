import { expectTypeOf, test, describe } from 'vitest'
import { ToUrlQueryPart, ToUrlPart, UrlPart, withParams } from '@/services/withParams'

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

describe('QuerySourceToUrlPart', () => {
  test('given a string, returns UrlPart with that string', () => {
    type Source = ToUrlQueryPart<'foo=bar'>
    type Expect = UrlPart<{}>

    expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('given undefined, returns UrlPart with empty string', () => {
    type Source = ToUrlQueryPart<undefined>
    type Expect = UrlPart<{}>

    expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('given a UrlPart type, returns the same type', () => {
    const query = withParams('foo=[foo]', { foo: Number })
    type Source = ToUrlQueryPart<typeof query>
    type Expect = UrlPart<{ foo: { param: NumberConstructor, isOptional: false, isGreedy: false } }>

    expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('given a record with string values, returns record of UrlPart', () => {
    type Source = ToUrlQueryPart<{ foo: 'bar', baz: 'qux' }>
    type Expect = UrlPart<{}>

    expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('given a record with Param values, returns record of parameterized UrlPart', () => {
    type Source = ToUrlQueryPart<{ foo: NumberConstructor, baz: BooleanConstructor, zoo: '14' }>
    type Expect = UrlPart<{
      foo: { param: NumberConstructor, isOptional: false, isGreedy: false },
      baz: { param: BooleanConstructor, isOptional: false, isGreedy: false },
    }>

    expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('given an array with string tuples, each element maps to UrlPart', () => {
    type Source = ToUrlQueryPart<[['foo', 'bar'], ['baz', 'qux']]>
    type Expect = UrlPart<{}>

    expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })

  test('given an array with Param tuples, each element maps to parameterized UrlPart', () => {
    type Source = ToUrlQueryPart<[['foo', NumberConstructor], ['baz', BooleanConstructor], ['zoo', '14']]>
    type Expect = UrlPart<{
      foo: { param: NumberConstructor, isOptional: false, isGreedy: false },
      baz: { param: BooleanConstructor, isOptional: false, isGreedy: false },
    }>

    expectTypeOf<Source>().toEqualTypeOf<Expect>()
  })
})
