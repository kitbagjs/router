import { expect, test, describe } from 'vitest'
import { DuplicateParamsError } from '@/errors/duplicateParamsError'
import { toUrlPart, withParams } from '@/services/withParams'

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
