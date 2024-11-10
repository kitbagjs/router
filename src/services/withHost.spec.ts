import { expect, test } from 'vitest'
import { withHost } from '@/services/withHost'

test.each([undefined, ''])('given empty host with a url, returns url unmodified', (host) => {
  const url = '/foo'

  const response = withHost(url, host)

  expect(response).toBe(url)
})

test.each(['http://kitbag.dev', 'https://kitbag.dev'])('given host that satisfies Url type, returns host + url', (host) => {
  const url = 'foo'

  const response = withHost(url, host)

  expect(response).toBe(`${host}/${url}`)
})

test.each(['kitbag.dev', 'www.google.com'])('given host that does not satisfy Url type, returns https:// + host + url', (host) => {
  const url = 'foo'

  const response = withHost(url, host)

  expect(response).toBe(`https://${host}/${url}`)
})
