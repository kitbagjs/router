import { expect, test } from 'vitest'
import { combineUrl } from '@/services/urlCombine'

test.each([
  [{ host: 'https://kitbag.com' }, { host: 'https://kitbag.dev' }],
  [{ host: 'https://kitbag.dev' }, { host: '' }],
  [{ host: 'https://kitbag.dev' }, { host: undefined }],
])('given updated host with value, replaces previous host, else uses previous', (previous, updated) => {
  const url = combineUrl(previous, updated)

  expect(url).toBe('https://kitbag.dev/')
})

test.each([
  [{ path: '/bar' }, { path: '/foo' }],
  [{ path: '/foo' }, { path: '' }],
  [{ path: '/foo' }, { path: undefined }],
])('given updated pathname with value, replaces previous pathname, else uses previous', (previous, updated) => {
  const url = combineUrl(previous, updated)

  expect(url).toBe('/foo')
})

test.each([
  [{ query: '?foo=456' }, { query: '?bar=123' }],
  [{ query: '?bar=123&foo=456' }, { query: '' }],
  [{ query: '?bar=123&foo=456' }, { query: undefined }],
])('given updated search with value, combines previous search, else uses previous', (previous, updated) => {
  const url = combineUrl(previous, updated)

  expect(url).toBe('/?bar=123&foo=456')
})

test.each([
  [{ query: new URLSearchParams('?foo=456') }, { query: new URLSearchParams('?bar=123') }],
  [{ query: new URLSearchParams('?bar=123&foo=456') }, { query: new URLSearchParams('') }],
  [{ query: new URLSearchParams('?bar=123&foo=456') }, { query: undefined }],
])('given updated searchParams with value, combines previous search, else uses previous', (previous, updated) => {
  const url = combineUrl(previous, updated)

  expect(url).toBe('/?bar=123&foo=456')
})

test.each([
  [{ hash: 'bar' }, { hash: 'foo' }],
  [{ hash: 'foo' }, { hash: '' }],
  [{ hash: 'foo' }, { hash: undefined }],
])('given updated hash with value, replaces previous hash, else uses previous', (previous, updated) => {
  const url = combineUrl(previous, updated)

  expect(url).toBe('/#foo')
})
