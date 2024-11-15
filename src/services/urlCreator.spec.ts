import { expect, test } from 'vitest'
import { createUrl } from '@/services/urlCreator'

test('given parts without host, protocol, or path, returns forward slash to satisfy Url', () => {
  const url = createUrl({})

  expect(url).toBe('/')
})

test.each(['foo', '/foo'])('given parts with pathname, returns value with pathname', (pathname) => {
  const parts = {
    host: 'kitbag.dev',
    protocol: 'https://',
    pathname,
  }

  const url = createUrl(parts)

  expect(url).toBe('https://kitbag.dev/foo')
})

test.each(['?bar=123', 'bar=123'])('given parts with search, returns value with search', (search) => {
  const parts = {
    host: 'kitbag.dev',
    protocol: 'https://',
    search,
  }

  const url = createUrl(parts)

  expect(url).toBe('https://kitbag.dev/?bar=123')
})

test('given parts with searchParams AND search, chooses searchParams', () => {
  const parts = {
    pathname: '/foo',
    searchParams: new URLSearchParams([['bar', '123']]),
    search: 'zoo=456',
  }

  const url = createUrl(parts)

  expect(url).toBe('/foo?bar=123')
})

test.each(['bar', '#bar'])('given parts with hash, returns value with hash', (hash) => {
  const parts = {
    host: 'kitbag.dev',
    protocol: 'https://',
    hash,
  }

  const url = createUrl(parts)

  expect(url).toBe('https://kitbag.dev/#bar')
})

test('given parts without host and protocol, returns url starting with forward slash', () => {
  const parts = {
    pathname: '/foo',
    search: '?bar=123',
  }

  const url = createUrl(parts)

  expect(url).toBe('/foo?bar=123')
})

test.each([
  {
    host: 'router.kitbag.dev',
    protocol: 'https:',
  },
  {
    host: 'github.io',
    protocol: 'https://',
  },
])('given parts with host and protocol, returns value that satisfies Url', (parts) => {
  const url = createUrl(parts)

  expect(url).toBe(`https://${parts.host}/`)
})
