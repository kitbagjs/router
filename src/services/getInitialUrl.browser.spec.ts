import { expect, test, vi } from 'vitest'
import { getInitialUrl } from '@/services/getInitialUrl'
import { random } from '@/utilities/testHelpers'

test('given value for initial route, returns value', () => {
  const initialRoute = random.number().toString()

  const response = getInitialUrl(initialRoute)

  expect(response).toBe(initialRoute)
})

test('defaults to window.location without protocol or host', () => {
  const initialRoute = 'https://localhost:5173/home?with=search#foo'
  vi.stubGlobal('location', initialRoute)

  const response = getInitialUrl()

  expect(response).toBe(initialRoute)
})

test('hash mode reads the initial url from the hash', () => {
  vi.stubGlobal('location', { hash: '#/dashboard?tab=1' })

  const response = getInitialUrl(undefined, 'hash')

  expect(response).toBe('/dashboard?tab=1')
})

test('hash mode without a hash starts at the root', () => {
  vi.stubGlobal('location', { hash: '' })

  const response = getInitialUrl(undefined, 'hash')

  expect(response).toBe('/')
})

test('a given initial url wins over the hash', () => {
  vi.stubGlobal('location', { hash: '#/dashboard' })

  const response = getInitialUrl('/given', 'hash')

  expect(response).toBe('/given')
})
