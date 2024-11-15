import { expect, test } from 'vitest'
import { parseUrl } from '@/services/urlParser'

test('given relative url, returns host and protocol undefined', () => {
  const url = '/foo?bar=123'

  const parts = parseUrl(url)

  expect(parts.host).toBe(undefined)
  expect(parts.protocol).toBe(undefined)
})

test('given absolute url with path, returns everything up to pathname', () => {
  const url = 'https://kitbag.dev/foo'

  const parts = parseUrl(url)

  expect(parts.host).toBe('kitbag.dev')
  expect(parts.protocol).toBe('https:')
  expect(parts.pathname).toBe('/foo')
  expect(parts.search).toBe('')
  expect(parts.hash).toBe('')
})

test('given absolute url with path and query, returns everything up to search', () => {
  const url = 'https://kitbag.dev/foo?bar=123'

  const parts = parseUrl(url)

  expect(parts.host).toBe('kitbag.dev')
  expect(parts.protocol).toBe('https:')
  expect(parts.pathname).toBe('/foo')
  expect(parts.search).toBe('?bar=123')
  expect(parts.hash).toBe('')
})

test('given absolute url with path, query, and hash, returns everything', () => {
  const url = 'https://kitbag.dev/foo?bar=123#zoo'

  const parts = parseUrl(url)

  expect(parts.host).toBe('kitbag.dev')
  expect(parts.protocol).toBe('https:')
  expect(parts.pathname).toBe('/foo')
  expect(parts.search).toBe('?bar=123')
  expect(parts.hash).toBe('#zoo')
})
