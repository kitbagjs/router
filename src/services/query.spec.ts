import { expect, test } from 'vitest'
import { DuplicateParamsError } from '@/errors'
import { optional } from '@/services/optional'
import { query } from '@/services/query'

test('given query without params, returns empty object', () => {
  const response = query('without=params', {})

  expect(response.params).toMatchObject({})
})

test('given query with simple params, returns each param name as type String', () => {
  const response = query('parent=[parentId]&child=[childId]', {})

  expect(response.params).toMatchObject({
    parentId: String,
    childId: String,
  })
})

test('given query with optional params, returns each param name as type String with optional', () => {
  const response = query('parent=[?parentId]&child=[?childId]', {})

  expect(JSON.stringify(response.params)).toMatch(JSON.stringify({
    parentId: optional(String),
    childId: optional(String),
  }))
})

test('given query not as string, returns each param with corresponding param', () => {
  const response = query('parent=[parentId]&child=[childId]', {
    parentId: Boolean,
  })

  expect(response.params).toMatchObject({
    parentId: Boolean,
    childId: String,
  })
})

test('given query with the same param name, throws TS error', () => {
  const action: () => void = () => query('foo=[foo]&sub=[?foo]', {
    foo: Boolean,
  })

  expect(action).toThrowError(DuplicateParamsError)
})