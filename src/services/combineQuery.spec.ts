import { expect, test } from 'vitest'
import { DuplicateParamsError } from '@/errors/duplicateParamsError'
import { combineQuery } from '@/services/combineQuery'
import { withParams } from '@/services/withParams'

test('given 2 queries, returns new Query joined together', () => {
  const aQuery = withParams('foo=ABC', {})
  const bQuery = withParams('bar=123', {})

  const response = combineQuery(aQuery, bQuery)

  expect(response.value).toBe('foo=ABC&bar=123')
})

test('given 2 queries with params, returns new Query joined together with params', () => {
  const aQuery = withParams('foo=[foz]', { foz: Boolean })
  const bQuery = withParams('bar=[baz]', { baz: Number })

  const response = combineQuery(aQuery, bQuery)

  expect(response.value).toBe('foo=[foz]&bar=[baz]')
  expect(Object.entries(response.params)).toMatchObject([['foz', Boolean], ['baz', Number]])
})

test('given 2 queries with optional params, returns new Query joined together with params', () => {
  const aQuery = withParams('foo=[?foz]', { foz: Boolean })
  const bQuery = withParams('bar=[?baz]', { baz: Number })

  const response = combineQuery(aQuery, bQuery)

  expect(response.value).toBe('foo=[?foz]&bar=[?baz]')
  expect(Object.entries(response.params)).toMatchObject([['?foz', Boolean], ['?baz', Number]])
})

test('given 2 queries with params that include duplicates, throws DuplicateParamsError', () => {
  const aQuery = withParams('foo=[foz]', { foz: String })
  const bQuery = withParams('foo=[foz]', { foz: String })

  const action: () => void = () => combineQuery(aQuery, bQuery)

  expect(action).toThrow(DuplicateParamsError)
})
