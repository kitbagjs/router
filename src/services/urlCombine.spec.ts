import { expect, test } from 'vitest'
import { combineUrl } from '@/services/urlCombine'

test.each([
  [{ protocol: 'https', host: 'kitbag.com' }, { host: 'kitbag.dev' }],
  [{ protocol: 'https', host: 'kitbag.dev' }, { host: '' }],
  [{ protocol: 'https', host: 'kitbag.dev' }, { host: undefined }],
])('given updated host with value, replaces previous host, else uses previous', (previous, updated) => {
  const url = combineUrl(previous, updated)

  expect(url).toBe('https://kitbag.dev/')
})

test.each([
  [{ pathname: '/bar' }, { pathname: '/foo' }],
  [{ pathname: '/foo' }, { pathname: '' }],
  [{ pathname: '/foo' }, { pathname: undefined }],
])('given updated pathname with value, replaces previous pathname, else uses previous', (previous, updated) => {
  const url = combineUrl(previous, updated)

  expect(url).toBe('/foo')
})

test.each([
  [{ search: '?foo=456' }, { search: '?bar=123' }],
  [{ search: '?bar=123&foo=456' }, { search: '' }],
  [{ search: '?bar=123&foo=456' }, { search: undefined }],
])('given updated search with value, combines previous search, else uses previous', (previous, updated) => {
  const url = combineUrl(previous, updated)

  expect(url).toBe('/?bar=123&foo=456')
})

test.each([
  [{ searchParams: new URLSearchParams('?foo=456') }, { searchParams: new URLSearchParams('?bar=123') }],
  [{ searchParams: new URLSearchParams('?bar=123&foo=456') }, { searchParams: new URLSearchParams('') }],
  [{ searchParams: new URLSearchParams('?bar=123&foo=456') }, { searchParams: undefined }],
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
