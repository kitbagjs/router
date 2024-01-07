import { describe, expect, test, vi } from 'vitest'
import { random } from '.'
import { getInitialUrl } from '@/utilities/getInitialUrl'

describe('getInitialUrl', () => {
  test('given value for initial route, returns value', () => {
    const initialRoute = random.number().toString()

    const response = getInitialUrl(initialRoute)


    expect(response).toBe(initialRoute)
  })

  test('defaults to window.location', () => {
    const initialRoute = random.number().toString()
    vi.stubGlobal('location', initialRoute)

    const response = getInitialUrl()

    expect(response).toBe(initialRoute)
  })
})