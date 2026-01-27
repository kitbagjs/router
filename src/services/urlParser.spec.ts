import { expect, test } from 'vitest'
import { parseUrl } from '@/services/urlParser'

test('given relative url, returns host and protocol undefined', () => {
  const url = '/foo?bar=123'

  const parts = parseUrl(url)

  expect(parts.host).toBe(undefined)
})

test('given absolute url with path, returns everything up to pathname', () => {
  const url = 'https://kitbag.dev/foo'

  const parts = parseUrl(url)

  expect(parts.host).toBe('kitbag.dev')
  expect(parts.path).toBe('/foo')
  expect(parts.query.toString()).toBe('')
  expect(parts.hash).toBe('')
})

test('given absolute url with path and query, returns everything up to search', () => {
  const url = 'https://kitbag.dev/foo?bar=123'

  const parts = parseUrl(url)

  expect(parts.host).toBe('https://kitbag.dev')
  expect(parts.path).toBe('/foo')
  expect(parts.query.toString()).toBe('?bar=123')
  expect(parts.hash).toBe('')
})

test('given absolute url with path, query, and hash, returns everything', () => {
  const url = 'https://kitbag.dev/foo?bar=123#zoo'

  const parts = parseUrl(url)

  expect(parts.host).toBe('https://kitbag.dev')
  expect(parts.path).toBe('/foo')
  expect(parts.query.toString()).toBe('?bar=123')
  expect(parts.hash).toBe('#zoo')
})
