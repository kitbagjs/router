import { expect, test } from 'vitest'
import { DuplicateParamsError } from '@/errors/duplicateParamsError'
import { withParams } from '@/services/withParams'

test('given value without params, returns empty object', () => {
  const response = withParams('example-without-params', {})

  expect(response.params).toMatchObject({})
})

test('given value with simple params, returns each param name as type String', () => {
  const response = withParams('[parentId]-[childId]', {})

  expect(response.params).toMatchObject({
    parentId: String,
    childId: String,
  })
})

test('given value with optional params, returns each param name as type String', () => {
  const response = withParams('[?parentId]-[?childId]', {})

  expect(JSON.stringify(response.params)).toMatch(JSON.stringify({
    parentId: String,
    childId: String,
  }))
})

test('given value with param types, returns each param with corresponding param', () => {
  const response = withParams('[parentId]-[childId]', {
    parentId: Boolean,
  })

  expect(response.params).toMatchObject({
    parentId: Boolean,
    childId: String,
  })
})

test('given value with the same param name, throws DuplicateParamsError', () => {
  const action: () => void = () => withParams('[foo]-[?foo]', { })

  expect(action).toThrowError(DuplicateParamsError)
})
