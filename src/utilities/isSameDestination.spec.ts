import { expect, test } from 'vitest'
import { Destination, isSameDestination } from '@/utilities/isSameDestination'

const destination: Destination = { id: 'route', href: '/route', state: { page: '1' } }

test('given matching route, URL, and state, returns true', () => {
  expect(isSameDestination(destination, { ...destination, state: { page: '1' } })).toBe(true)
})

test('given different route IDs, returns false', () => {
  expect(isSameDestination(destination, { ...destination, id: 'other' })).toBe(false)
})

test('given different URLs, returns false', () => {
  expect(isSameDestination(destination, { ...destination, href: '/other' })).toBe(false)
})

test('given different state, returns false', () => {
  expect(isSameDestination(destination, { ...destination, state: { page: '2' } })).toBe(false)
})

test('given no destinations, returns true', () => {
  expect(isSameDestination(undefined, undefined)).toBe(true)
})

test('given only one destination, returns false', () => {
  expect(isSameDestination(destination, undefined)).toBe(false)
  expect(isSameDestination(undefined, destination)).toBe(false)
})
