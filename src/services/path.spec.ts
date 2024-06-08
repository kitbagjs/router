import { expect, test } from 'vitest'
import { DuplicateParamsError } from '@/errors'
import { optional, withDefault } from '@/services/params'
import { path } from '@/services/path'

test('given path without params, returns empty object', () => {
  const response = path('/string/example/without/params', {})

  expect(response.params).toMatchObject({})
})

test('given path with simple params, returns each param name as type String', () => {
  const response = path('/parent/[parentId]/child/[childId]', {})

  expect(response.params).toMatchObject({
    parentId: String,
    childId: String,
  })
})

test('given path with optional params, returns each param name as type String with optional', () => {
  const response = path('/parent/[?parentId]/child/[?childId]', {})

  expect(JSON.stringify(response.params)).toMatch(JSON.stringify({
    parentId: optional(String),
    childId: optional(String),
  }))
})


test('given path with default params, returns each param name as type String with default', () => {
  const response = path('/parent/[?parentId]/child/[?childId]', {})

  expect(JSON.stringify(response.params)).toMatch(JSON.stringify({
    parentId: withDefault(String, 'abc'),
    childId: withDefault(String, 'abc'),
  }))
})

test('given path not as string, returns each param with corresponding param', () => {
  const response = path('/parent/[parentId]/child/[childId]', {
    parentId: Boolean,
  })

  expect(response.params).toMatchObject({
    parentId: Boolean,
    childId: String,
  })
})

test('given path with the same param name, throws DuplicateParamsError', () => {
  const action: () => void = () => path('/foo/[foo]/sub/[?foo]', { })

  expect(action).toThrowError(DuplicateParamsError)
})