import { describe, expect, test } from 'vitest'
import { getCaptureGroup } from '@/utilities'

describe('getCaptureGroup', () => {
  test('given string with no matches, returns empty array', () => {
    const input = 'abcdefg'
    const pattern = /\d/g

    const response = getCaptureGroup(input, pattern)

    expect(response).toHaveLength(0)
  })

  test('given string with matches but no capture groups, returns empty array', () => {
    const input = 'abc1defg'
    const pattern = /\d/g

    const response = getCaptureGroup(input, pattern)

    expect(response).toHaveLength(0)
  })

  test('given string with single match, returns single value in array', () => {
    const input = 'abc1defg'
    const pattern = /(\d)/g

    const response = getCaptureGroup(input, pattern)

    expect(response).toMatchObject(['1'])
  })

  test('given string with multiple matches, returns each match value in array', () => {
    const input = '1a21b3c24d5e6f7g86'
    const pattern = /\d(\d)/g

    const response = getCaptureGroup(input, pattern)

    expect(response).toMatchObject(['1', '4', '6'])
  })
})