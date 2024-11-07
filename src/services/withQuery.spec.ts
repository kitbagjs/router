import { expect, test } from 'vitest'
import { withQuery } from '@/services/withQuery'

test.each([undefined, {}])('given empty query, does nothing', (query) => {
  const url = 'https://www.github.io'

  const response = withQuery(url, query)

  expect(response).toBe(url)
})

test('given query with a url that has no query, adds query to url', () => {
  const url = 'https://www.github.io'

  const response = withQuery(url, { foo: 'foo', simple: 'ABC' })

  expect(response).toBe(`${url}?foo=foo&simple=ABC`)
})

test('given query with a url that existing query, adds query to end of url', () => {
  const url = 'https://www.github.io?with=query'

  const response = withQuery(url, { foo: 'foo', simple: 'ABC' })

  expect(response).toBe(`${url}&foo=foo&simple=ABC`)
})

test('given query with a url that existing query with same key, does nothing to merge them as of now', () => {
  const url = 'https://www.github.io?foo=existing'

  const response = withQuery(url, { foo: 'foo', simple: 'ABC' })

  expect(response).toBe(`${url}&foo=foo&simple=ABC`)
})
