import { describe, expect, test } from 'vitest'
import { createMaybeRelativeUrl, maybeRelativeUrlToString } from '@/services/maybeRelativeUrl'

describe('createMaybeRelativeUrl', () => {
  test('given relative url, returns host and protocol undefined', () => {
    const url = '/foo?bar=123'

    const parts = createMaybeRelativeUrl(url)

    expect(parts.host).toBe(undefined)
    expect(parts.protocol).toBe(undefined)
  })

  test('given absolute url with path, returns everything up to pathname', () => {
    const url = 'https://kitbag.dev/foo'

    const parts = createMaybeRelativeUrl(url)

    expect(parts.host).toBe('kitbag.dev')
    expect(parts.protocol).toBe('https:')
    expect(parts.pathname).toBe('/foo')
    expect(parts.search).toBe('')
    expect(parts.hash).toBe('')
  })

  test('given absolute url with path and query, returns everything up to search', () => {
    const url = 'https://kitbag.dev/foo?bar=123'

    const parts = createMaybeRelativeUrl(url)

    expect(parts.host).toBe('kitbag.dev')
    expect(parts.protocol).toBe('https:')
    expect(parts.pathname).toBe('/foo')
    expect(parts.search).toBe('?bar=123')
    expect(parts.hash).toBe('')
  })

  test('given absolute url with path, query, and hash, returns everything', () => {
    const url = 'https://kitbag.dev/foo?bar=123#zoo'

    const parts = createMaybeRelativeUrl(url)

    expect(parts.host).toBe('kitbag.dev')
    expect(parts.protocol).toBe('https:')
    expect(parts.pathname).toBe('/foo')
    expect(parts.search).toBe('?bar=123')
    expect(parts.hash).toBe('#zoo')
  })
})

describe('maybeRelativeUrlToString', () => {
  test('given parts without host, protocol, or path, returns forward slash to satisfy Url', () => {
    const url = maybeRelativeUrlToString({})

    expect(url).toBe('/')
  })

  test('given parts without host, protocol, or valid path, returns forward slash to satisfy Url', () => {
    const url = maybeRelativeUrlToString({
      pathname: 'foo',
    })

    expect(url).toBe('/foo')
  })

  test('given parts without host and protocol, returns url starting with forward slash', () => {
    const parts = {
      pathname: '/foo',
      search: '?bar=123',
    }

    const url = maybeRelativeUrlToString(parts)

    expect(url).toBe('/foo?bar=123')
  })

  test('given parts with searchParams, does nothing', () => {
    const parts = {
      pathname: '/foo',
      searchParams: new URLSearchParams([['bar', '123']]),
    }

    const url = maybeRelativeUrlToString(parts)

    expect(url).toBe('/foo')
  })

  test('given parts with host and protocol, returns value that satisfies Url', () => {
    const parts = {
      host: 'kitbag.dev',
      protocol: 'https:',
    }

    const url = maybeRelativeUrlToString(parts)

    expect(url).toBe('https://kitbag.dev')
  })
})
