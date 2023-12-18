import { describe, expect, test } from 'vitest'
import { optional } from '@/types'
import { path } from '@/utilities'

describe('path', () => {
  test('given path without params, returns empty object', () => {
    const response = path('/string/example/without/params', {})

    expect(response.params).toMatchObject({})
  })

  test('given path with simple params, returns each param name as type String', () => {
    const response = path('/parent/:parentId/child/:childId', {})

    expect(response.params).toMatchObject({
      parentId: [String],
      childId: [String],
    })
  })

  test('given path with optional params, returns each param name as type String with optional', () => {
    const response = path('/parent/:?parentId/child/:?childId', {})

    expect(JSON.stringify(response.params)).toMatch(JSON.stringify({
      parentId: [optional(String)],
      childId: [optional(String)],
    }))
  })

  test('given path not as string, returns each param with corresponding param', () => {
    const response = path('/parent/:parentId/child/:childId', {
      parentId: Boolean,
    })

    expect(response.params).toMatchObject({
      parentId: [Boolean],
      childId: [String],
    })
  })

  test('given path with the same param name one required and one optional, returns both in tuple', () => {
    const response = path('/foo/:foo/sub/:?foo', {
      foo: Boolean,
    })

    expect(JSON.stringify(response.params)).toMatchObject(JSON.stringify({
      foo: [Boolean, optional(Boolean)],
    }))
  })
})