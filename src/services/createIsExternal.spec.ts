import { expect, test } from 'vitest'
import { createIsExternal } from '@/services/createIsExternal'

test('given undefined host, returns true', () => {
  const host: string | undefined = undefined
  const url = 'https://router.kitbag.dev/introduction.html#introduction'

  const isExternal = createIsExternal(host)
  const response = isExternal(url)

  expect(response).toBe(true)
})

test('given host with url that matches, returns false', () => {
  const host = 'https://router.kitbag.dev'
  const url = 'https://router.kitbag.dev/introduction.html#introduction'

  const isExternal = createIsExternal(host)
  const response = isExternal(url)

  expect(response).toBe(false)
})

test('given host with url that does NOT match, returns true', () => {
  const host = 'https://github.com'
  const url = 'https://router.kitbag.dev/introduction.html#introduction'

  const isExternal = createIsExternal(host)
  const response = isExternal(url)

  expect(response).toBe(true)
})
