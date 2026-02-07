import { expectTypeOf, test } from 'vitest'
import { withParams, UrlPart } from '@/services/withParams'
import { combinePath } from './combinePath'

test('given withParams without params, combines value, leaves params empty', () => {
  const parent = withParams('/parent-without-params', {})
  const child = withParams('/child-without-params', {})

  const response = combinePath(parent, child)

  type Source = typeof response
  type Expect = UrlPart<{}>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('given withParams with unassigned params on parent, combines value, has single param from parent', () => {
  const parent = withParams('/parent-with-[param]', {})
  const child = withParams('/child-without-params', {})

  const response = combinePath(parent, child)

  type Source = typeof response
  type Expect = UrlPart<{
    param: [StringConstructor, { isOptional: false, isGreedy: false }],
  }>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('given withParams with optional unassigned params on parent, combines value, has single param from parent', () => {
  const parent = withParams('/parent-with-[?param]', {})
  const child = withParams('/child-without-params', {})

  const response = combinePath(parent, child)

  type Source = typeof response
  type Expect = UrlPart<{
    param: [StringConstructor, { isOptional: true, isGreedy: false }],
  }>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('given withParams with params on parent, combines value, has single param from parent', () => {
  const parent = withParams('/parent-with-[param]', { param: Boolean })
  const child = withParams('/child-without-params', {})

  const response = combinePath(parent, child)

  type Source = typeof response
  type Expect = UrlPart<{
    param: [BooleanConstructor, { isOptional: false, isGreedy: false }],
  }>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('given withParams with optional params on parent, combines value, has single param from parent', () => {
  const parent = withParams('/parent-with-[?param]', { param: Boolean })
  const child = withParams('/child-without-params', {})

  const response = combinePath(parent, child)

  type Source = typeof response
  type Expect = UrlPart<{
    param: [BooleanConstructor, { isOptional: true, isGreedy: false }],
  }>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})

test('given withParams with params on both, combines value, has single param from parent', () => {
  const parent = withParams('/parent-with-[param]', { param: Boolean })
  const child = withParams('/child-with-[something]', { something: Number })

  const response = combinePath(parent, child)

  type Source = typeof response
  type Expect = UrlPart<{
    param: [BooleanConstructor, { isOptional: false, isGreedy: false }],
    something: [NumberConstructor, { isOptional: false, isGreedy: false }],
  }>

  expectTypeOf<Source>().toEqualTypeOf<Expect>()
})
