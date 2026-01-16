import { expect, test } from 'vitest'
import { combineUrl } from '@/services/urlCombine'

test.each([
  [{ host: 'https://kitbag.com' }, { host: 'https://kitbag.dev' }],
  [{ host: 'https://kitbag.dev' }, { host: '' }],
  [{ host: 'https://kitbag.dev' }, { host: undefined }],
])('given previous host (%s) and updated host (%s), returns updated host', (previous, updated) => {
  const url = combineUrl(previous, updated)

  expect(url.toString()).toBe('https://kitbag.dev/')
})

test.each([
  [{ path: '/bar' }, { path: '/foo' }],
  [{ path: '/foo' }, { path: '' }],
  [{ path: '/foo' }, { path: undefined }],
])('given previous path (%s) and updated path (%s), returns updated path', (previous, updated) => {
  const url = combineUrl(previous, updated)

  expect(url.toString()).toBe('/foo')
})

test.each([
  [{ query: '?foo=456' }, { query: '?bar=123' }],
  [{ query: '?bar=123&foo=456' }, { query: '' }],
  [{ query: '?bar=123&foo=456' }, { query: undefined }],
])('given previous query (%s) and updated query (%s), returns updated query', (previous, updated) => {
  const url = combineUrl(previous, updated)

  expect(url.toString()).toBe('/?bar=123&foo=456')
})

test.each([
  [{ hash: 'bar' }, { hash: 'foo' }],
  [{ hash: 'foo' }, { hash: '' }],
  [{ hash: 'foo' }, { hash: undefined }],
])('given previous hash (%s) and updated hash (%s), returns updated hash', (previous, updated) => {
  const url = combineUrl(previous, updated)

  expect(url.toString()).toBe('/#foo')
})
