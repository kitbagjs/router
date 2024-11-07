import { expect, test } from 'vitest'
import { DuplicateParamsError } from '@/errors/duplicateParamsError'
import { combineQuery } from '@/services/combineQuery'
import { query } from '@/services/query'

test('given 2 queries, returns new Query joined together', () => {
  const aQuery = query('foo=ABC', {})
  const bQuery = query('bar=123', {})

  const response = combineQuery(aQuery, bQuery)

  expect(response.toString()).toBe('foo=ABC&bar=123')
})

test('given 2 queries with params, returns new Query joined together with params', () => {
  const aQuery = query('foo=[foz]', { foz: String })
  const bQuery = query('bar=[?baz]', { baz: Number })

  const response = combineQuery(aQuery, bQuery)

  expect(response.toString()).toBe('foo=[foz]&bar=[?baz]')
  expect(Object.keys(response.params)).toMatchObject(['foz', '?baz'])
})

test('given 2 queries with params that include duplicates, throws DuplicateParamsError', () => {
  const aQuery = query('foo=[foz]', { foz: String })
  const bQuery = query('foo=[foz]', { foz: String })

  const action: () => void = () => combineQuery(aQuery, bQuery)

  expect(action).toThrow(DuplicateParamsError)
})
