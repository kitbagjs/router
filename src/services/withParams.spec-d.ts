/* eslint-disable @typescript-eslint/no-unused-vars */
import { expectTypeOf, test } from 'vitest'
import { withParams, WithParams } from '@/services/withParams'

test('given a string without params, expects no params', () => {
  const source = withParams('/something-without-params', {})

  type Source = typeof source
  type Expect = WithParams<'/something-without-params', {}>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('given a string with required params NOT assigned, uses string constructor', () => {
  const source = withParams('/something-with-[param]', {})

  type Source = typeof source
  type Expect = WithParams<'/something-with-[param]', { param: StringConstructor }>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('given a string with optional params NOT assigned, uses string constructor', () => {
  const source = withParams('/something-with-[?param]', {})

  type Source = typeof source
  type Expect = WithParams<'/something-with-[?param]', { param: StringConstructor }>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('given a string with required params assigned, uses passed in Type', () => {
  const source = withParams('/something-with-[param]', { param: Boolean })

  type Source = typeof source
  type Expect = WithParams<'/something-with-[param]', { param: BooleanConstructor }>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('given a string with optional params assigned, uses passed in Type', () => {
  const source = withParams('/something-with-[?param]', { param: Boolean })

  type Source = typeof source
  type Expect = WithParams<'/something-with-[?param]', { param: BooleanConstructor }>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})
