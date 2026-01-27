import { describe, expect, test } from 'vitest'
import { parseUrl, stringifyUrl, updateUrl } from '@/services/urlParser'

describe('parseUrl', () => {
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
})

describe('stringifyUrl', () => {
  test('given parts, returns stringified url', () => {
    const parts = {
      host: 'https://kitbag.dev',
      path: '/foo',
      query: '?bar=123',
      hash: '#zoo',
    }

    const url = stringifyUrl(parts)

    expect(url).toBe('https://kitbag.dev/foo?bar=123#zoo')
  })
})

describe('updateUrl', () => {
  test.each([
    [{ host: 'https://kitbag.com' }, { host: 'https://kitbag.dev' }],
    [{ host: 'https://kitbag.dev' }, { host: '' }],
    [{ host: 'https://kitbag.dev' }, { host: undefined }],
  ])('given previous host (%s) and updated host (%s), returns updated host', (previous, updated) => {
    const url = updateUrl(previous, updated)

    expect(url.host).toBe('https://kitbag.dev/')
  })

  test.each([
    [{ path: '/bar' }, { path: '/foo' }],
    [{ path: '/foo' }, { path: '' }],
    [{ path: '/foo' }, { path: undefined }],
  ])('given previous path (%s) and updated path (%s), returns updated path', (previous, updated) => {
    const url = updateUrl(previous, updated)

    expect(url.path).toBe('/foo')
  })

  test.each([
    [{ query: new URLSearchParams('?foo=456') }, { query: new URLSearchParams('?bar=123') }],
    [{ query: new URLSearchParams('?foo=456') }, { query: '?bar=123' }],
    [{ query: new URLSearchParams('?bar=123&foo=456') }, { query: '' }],
    [{ query: new URLSearchParams('?bar=123&foo=456') }, { query: undefined }],
  ])('given previous query (%s) and updated query (%s), returns updated query', (previous, updated) => {
    const url = updateUrl(previous, updated)

    expect(url.query.toString()).toBe('?bar=123&foo=456')
  })

  test.each([
    [{ hash: 'bar' }, { hash: 'foo' }],
    [{ hash: 'foo' }, { hash: '' }],
    [{ hash: 'foo' }, { hash: undefined }],
  ])('given previous hash (%s) and updated hash (%s), returns updated hash', (previous, updated) => {
    const url = updateUrl(previous, updated)

    expect(url.hash).toBe('#foo')
  })
})
