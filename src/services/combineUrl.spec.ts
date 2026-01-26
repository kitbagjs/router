import { expect, test } from 'vitest'
import { combineUrl } from '@/services/combineUrl'
import { createUrl } from '@/services/createUrl'

test.each([
  [{ host: 'https://kitbag.dev' }, { host: 'https://kitbag.com' }],
  [{ host: 'https://kitbag.dev' }, { host: '' }],
  [{ host: 'https://kitbag.dev' }, { host: undefined }],
])('given parent host (%s) and child host (%s), returns parent host', (parent, child) => {
  const url = combineUrl(createUrl(parent), createUrl(child))

  expect(url.stringify()).toBe('https://kitbag.dev/')
})

test.each([
  [{ path: '/foo' }, { path: '/bar' }],
  [{ path: '/foo/bar' }, { path: '' }],
  [{ path: '/foo/bar' }, { path: undefined }],
])('given parent path (%s) and child path (%s), returns paths combined', (parent, child) => {
  const url = combineUrl(createUrl(parent), createUrl(child))

  expect(url.stringify()).toBe('/foo/bar')
})

test.each([
  [{ query: '?foo=456' }, { query: '?bar=123' }],
  [{ query: '?foo=456&bar=123' }, { query: '' }],
  [{ query: '?foo=456&bar=123' }, { query: undefined }],
])('given parent query (%s) and child query (%s), returns child query', (parent, child) => {
  const url = combineUrl(createUrl(parent), createUrl(child))

  expect(url.stringify()).toBe('/?foo=456&bar=123')
})

test.each([
  [{ hash: '#foo' }, { hash: '#bar' }],
  [{ hash: '#foobar' }, { hash: '' }],
  [{ hash: '#foobar' }, { hash: undefined }],
])('given parent hash (%s) and child hash (%s), returns child hash', (parent, child) => {
  const url = combineUrl(createUrl(parent), createUrl(child))

  expect(url.stringify()).toBe('/#foobar')
})
