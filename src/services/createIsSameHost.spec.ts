import { expect, test } from 'vitest'
import { createIsSameHost } from '@/services/createIsSameHost'

test('given undefined host, returns true', () => {
  const host: string | undefined = undefined
  const url = 'https://router.kitbag.dev/introduction.html#introduction'

  const isSameHost = createIsSameHost(host)
  const response = isSameHost(url)

  expect(response).toBe(true)
})

test('given host with url that matches, returns true', () => {
  const host = 'router.kitbag.dev'
  const url = 'https://router.kitbag.dev/introduction.html#introduction'

  const isSameHost = createIsSameHost(host)
  const response = isSameHost(url)

  expect(response).toBe(true)
})

test('given host with url that does NOT match, returns false', () => {
  const host = 'github.com'
  const url = 'https://router.kitbag.dev/introduction.html#introduction'

  const isSameHost = createIsSameHost(host)
  const response = isSameHost(url)

  expect(response).toBe(false)
})