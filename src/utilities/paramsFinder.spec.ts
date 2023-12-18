import { describe, expect, test } from 'vitest'
import { findParamValues } from '@/utilities'

describe('findParamValues', () => {
  test('given path WITHOUT params, always returns empty array', () => {
    const response = findParamValues('/no-params', '/no-params', 'key')

    expect(response).toHaveLength(0)
  })

  test('given paramName that does NOT match param on route, always returns empty array', () => {
    const response = findParamValues('/key/ABC/not-in/123', '/key/:key/not-in/:route', 'fail')

    expect(response).toHaveLength(0)
  })

  test('given paramName that matches param on route but value is not present, always returns empty array', () => {
    const response = findParamValues('/simple', '/simple/:simple', 'simple')

    expect(response).toHaveLength(0)
  })

  test('given paramName that matches param on route and value is not present, returns single value in array', () => {
    const response = findParamValues('/simple/ABC', '/simple/:simple', 'simple')

    expect(response).toMatchObject(['ABC'])
  })

  test('given paramName that matches multiple param on route and value is present, returns each value in array', () => {
    const response = findParamValues('/simple/ABC/DEF/gap/GHI', '/simple/:simple/:simple/gap/:simple', 'simple')

    expect(response).toMatchObject(['ABC', 'DEF', 'GHI'])
  })

  test('given paramName that matches multiple param on route value is present with some optional, returns each value in array including undefined', () => {
    const response = findParamValues('/simple/ABC//gap/GHI', '/simple/:simple/:?simple/gap/:simple', 'simple')

    expect(response).toMatchObject(['ABC', undefined, 'GHI'])
  })
})