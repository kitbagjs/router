import { describe, expect, test } from 'vitest'
import { optional } from '@/types'
import { path } from '@/utilities'

describe('path', () => {
  test('given path without params, returns empty object', () => {
    const input = '/string/example/without/params'

    const response = path(input, {})

    expect(response.params).toMatchObject({})
  })

  test('given path with simple params, returns each param name as type String', () => {
    const input = '/parent/:parentId/child/:childId'

    const response = path(input, {})

    expect(response.params).toMatchObject({
      parentId: [String],
      childId: [String],
    })
  })

  test('given path with optional params, returns each param name as type String with optional', () => {
    const input = '/parent/:?parentId/child/:?childId'

    const response = path(input, {})

    expect(JSON.stringify(response.params)).toMatch(JSON.stringify({
      parentId: [optional(String)],
      childId: [optional(String)],
    }))
  })

  test('given path not as string, returns each param with corresponding param', () => {
    const userDefinedParams = {
      parentId: Boolean,
    }

    const response = path('/parent/:parentId/child/:childId', userDefinedParams)

    expect(response.params).toMatchObject({
      parentId: [Boolean],
      childId: [String],
    })
  })
})