import { expectTypeOf, test } from 'vitest'
import { withParams, WithParams } from '@/services/withParams'
import { combinePath } from './combinePath'

test('given withParams without params, combines value, leaves params empty', () => {
  const parent = withParams('/parent-without-params', {})
  const child = withParams('/child-without-params', {})

  const response = combinePath(parent, child)

  type Source = typeof response
  type Expect = WithParams<'/parent-without-params/child-without-params', {}>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('given withParams with unassigned params on parent, combines value, has single param from parent', () => {
  const parent = withParams('/parent-with-[param]', {})
  const child = withParams('/child-without-params', {})

  const response = combinePath(parent, child)

  type Source = typeof response
  type Expect = WithParams<'/parent-with-[param]/child-without-params', {
    param: StringConstructor,
  }>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('given withParams with optional unassigned params on parent, combines value, has single param from parent', () => {
  const parent = withParams('/parent-with-[?param]', {})
  const child = withParams('/child-without-params', {})

  const response = combinePath(parent, child)

  type Source = typeof response
  type Expect = WithParams<'/parent-with-[?param]/child-without-params', {
    param: StringConstructor,
  }>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('given withParams with params on parent, combines value, has single param from parent', () => {
  const parent = withParams('/parent-with-[param]', { param: Boolean })
  const child = withParams('/child-without-params', {})

  const response = combinePath(parent, child)

  type Source = typeof response
  type Expect = WithParams<'/parent-with-[param]/child-without-params', {
    param: BooleanConstructor,
  }>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('given withParams with optional params on parent, combines value, has single param from parent', () => {
  const parent = withParams('/parent-with-[?param]', { param: Boolean })
  const child = withParams('/child-without-params', {})

  const response = combinePath(parent, child)

  type Source = typeof response
  type Expect = WithParams<'/parent-with-[?param]/child-without-params', {
    param: BooleanConstructor,
  }>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('given withParams with params on both, combines value, has single param from parent', () => {
  const parent = withParams('/parent-with-[param]', { param: Boolean })
  const child = withParams('/child-with-[something]', { something: Number })

  const response = combinePath(parent, child)

  type Source = typeof response
  type Expect = WithParams<'/parent-with-[param]/child-with-[something]', {
    param: BooleanConstructor,
    something: NumberConstructor,
  }>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})
