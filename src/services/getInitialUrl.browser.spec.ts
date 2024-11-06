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
