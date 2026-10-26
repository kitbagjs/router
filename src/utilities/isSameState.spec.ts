import { expect, test } from 'vitest'
import { isSameState } from '@/utilities/isSameState'

test('given empty states, returns true', () => {
  expect(isSameState({}, {})).toBe(true)
})

test('given the same keys and values in a different order, returns true', () => {
  expect(isSameState({ page: '1', filter: 'active' }, { filter: 'active', page: '1' })).toBe(true)
})

test('given different values, returns false', () => {
  expect(isSameState({ page: '1' }, { page: '2' })).toBe(false)
})

test('given an additional key, returns false', () => {
  expect(isSameState({ page: '1' }, { page: '1', filter: 'active' })).toBe(false)
})

test('given missing and undefined values, returns true', () => {
  expect(isSameState({}, { page: undefined })).toBe(true)
  expect(isSameState({ page: undefined }, {})).toBe(true)
})
