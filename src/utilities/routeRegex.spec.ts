import { expect, test } from 'vitest'
import { generateRouteRegexPattern } from '@/utilities/routeRegex'

test('given path without params, returns unmodified value with start and end markers', () => {
  const input = 'parent/child/grandchild'

  const result = generateRouteRegexPattern(input)

  const expected = new RegExp(`^${input}$`)
  expect(result.toString()).toBe(expected.toString())
})

test('given path with params, returns value with params replaced with catchall', () => {
  const input = 'parent/child/:childParam/grand-child/:grandChild123'

  const result = generateRouteRegexPattern(input)

  const catchAll = '(.+)'
  const expected = new RegExp(`^parent/child/${catchAll}/grand-child/${catchAll}$`)
  expect(result.toString()).toBe(expected.toString())
})

test('given path with optional params, returns value with params replaced with catchall', () => {
  const input = 'parent/child/:?childParam/grand-child/:?grandChild123'

  const result = generateRouteRegexPattern(input)

  const catchAll = '(.*)'
  const expected = new RegExp(`^parent/child/${catchAll}/grand-child/${catchAll}$`)
  expect(result.toString()).toBe(expected.toString())
})