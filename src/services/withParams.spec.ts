import { expect, test, describe } from 'vitest'
import { DuplicateParamsError } from '@/errors/duplicateParamsError'
import { toUrlQueryPart, toUrlPart, withParams } from '@/services/withParams'

test('given value without params, returns empty object', () => {
  const response = withParams('example-without-params', {})

  expect(response.params).toMatchObject({})
})

test('given value with simple params, returns each param name as type String', () => {
  const response = withParams('[parentId]-[childId]', {})

  expect(response.params).toMatchObject({
    parentId: { param: String, isOptional: false, isGreedy: false },
    childId: { param: String, isOptional: false, isGreedy: false },
  })
})

test('given value with optional params, returns each param name as type String', () => {
  const response = withParams('[?parentId]-[?childId]', {})

  expect(JSON.stringify(response.params)).toMatch(JSON.stringify({
    parentId: { param: String, isOptional: true, isGreedy: false },
    childId: { param: String, isOptional: true, isGreedy: false },
  }))
})

test('given value with param types, returns each param with corresponding param', () => {
  const response = withParams('[parentId]-[childId]', {
    parentId: Boolean,
  })

  expect(response.params).toMatchObject({
    parentId: { param: Boolean, isOptional: false, isGreedy: false },
    childId: { param: String, isOptional: false, isGreedy: false },
  })
})

test('given value with the same param name, throws DuplicateParamsError', () => {
  const action: () => void = () => withParams('[foo]-[?foo]', { })

  expect(action).toThrowError(DuplicateParamsError)
})

describe('toUrlPart', () => {
  test('given a string, returns UrlPart with that value', () => {
    const response = toUrlPart('foo=bar')

    expect(response.value).toBe('foo=bar')
  })

  test('given undefined, returns UrlPart with empty value', () => {
    const response = toUrlPart(undefined)

    expect(response.value).toBe('')
  })

  test('given a UrlPart object, returns same object', () => {
    const original = withParams('test', {})
    const response = toUrlPart(original)

    expect(response).toBe(original)
  })
})

describe('toUrlQueryPart', () => {
  test('given a string, returns UrlPartWithParams with that value', () => {
    const response = toUrlQueryPart('foo=bar')

    expect(response.value).toBe('foo=bar')
  })

  test('given undefined, returns UrlPartWithParams with empty value', () => {
    const response = toUrlQueryPart(undefined)

    expect(response.value).toBe('')
  })

  test('given a UrlPartWithParams object, returns same object', () => {
    const original = withParams('test', {})
    const response = toUrlQueryPart(original)

    expect(response).toBe(original)
  })

  test('given a record with string values, converts to query string', () => {
    const response = toUrlQueryPart({ foo: 'bar', baz: 'qux' })

    expect(response.value).toBe('foo=bar&baz=qux')
    expect(response.params).toMatchObject({})
  })

  test('given a record with Param values, converts to parameterized query string', () => {
    const response = toUrlQueryPart({ foo: Number, baz: Boolean })

    expect(response.value).toBe('foo=[foo]&baz=[baz]')
    expect(response.params).toMatchObject({
      foo: { param: Number, isOptional: false, isGreedy: false },
      baz: { param: Boolean, isOptional: false, isGreedy: false },
    })
  })

  test('given an array with string values, converts to query string', () => {
    const response = toUrlQueryPart([['foo', 'bar'], ['baz', 'qux']])

    expect(response.value).toBe('foo=bar&baz=qux')
    expect(response.params).toMatchObject({})
  })

  test('given an array with Param values, converts to parameterized query string', () => {
    const response = toUrlQueryPart([['foo', Number], ['baz', Boolean]])

    expect(response.value).toBe('foo=[foo]&baz=[baz]')
    expect(response.params).toMatchObject({
      foo: { param: Number, isOptional: false, isGreedy: false },
      baz: { param: Boolean, isOptional: false, isGreedy: false },
    })
  })

  test('given a mixed record with string and Param values, handles both correctly', () => {
    const response = toUrlQueryPart({ foo: 'bar', baz: Number })

    expect(response.value).toBe('foo=bar&baz=[baz]')
    expect(response.params).toMatchObject({ baz: { param: Number, isOptional: false, isGreedy: false } })
  })
})
