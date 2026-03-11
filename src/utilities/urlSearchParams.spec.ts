import { expect, test } from 'vitest'
import { combineUrlSearchParams } from './urlSearchParams'

test.each([
  'foo=bar',
  { foo: 'bar' },
  [['foo', 'bar']],
])('given different constructor types, normalizes into URLSearchParams', (params) => {
  const response = combineUrlSearchParams(params, undefined)

  expect(Array.from(response.entries())).toMatchObject([
    ['foo', 'bar'],
  ])
})

test('given duplicate keys, first group wins', () => {
  const aParams = new URLSearchParams({ foo: 'foo' })
  const bParams = new URLSearchParams({ foo: 'bar' })

  const response = combineUrlSearchParams(aParams, bParams)

  expect(Array.from(response.entries())).toMatchObject([
    ['foo', 'foo'],
  ])
})

test('given non-overlapping keys, includes both', () => {
  const aParams = new URLSearchParams({ foo: 'foo' })
  const bParams = new URLSearchParams({ bar: 'bar' })

  const response = combineUrlSearchParams(aParams, bParams)

  expect(Array.from(response.entries())).toMatchObject([
    ['foo', 'foo'],
    ['bar', 'bar'],
  ])
})
