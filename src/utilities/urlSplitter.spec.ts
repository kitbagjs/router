import { expect, test } from 'vitest'
import { splitUrl } from '@/utilities/urlSplitter'

test('given kitchen sink, returns everything', () => {
  const input = 'https://www.example.com:8080/path/123?query=123&another=true#hash'

  const response = splitUrl(input)

  expect(response).toMatchObject({
    protocol: 'https',
    domain: 'www.example.com',
    port: '8080',
    path: '/path/123',
    query: 'query=123&another=true',
    hash: 'hash',
  })
})