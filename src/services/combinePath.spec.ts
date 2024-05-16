import { expect, test } from 'vitest'
import { DuplicateParamsError } from '@/errors/duplicateParamsError'
import { combinePath } from '@/services/combinePath'
import { path } from '@/services/path'

test('given 2 paths, returns new Path joined together', () => {
  const aPath = path('/foo', {})
  const bPath = path('/bar', {})

  const response = combinePath(aPath, bPath)

  expect(response.toString()).toBe('/foo/bar')
})

test('given 2 paths with params, returns new Path joined together with params', () => {
  const aPath = path('/[foz]', { foz: String })
  const bPath = path('/[?baz]', { baz: Number })

  const response = combinePath(aPath, bPath)

  expect(response.toString()).toBe('/[foz]/[?baz]')
  expect(Object.keys(response.params)).toMatchObject(['foz', 'baz'])
})

test('given 2 paths with params that include duplicates, throws DuplicateParamsError', () => {
  const aPath = path('/[foz]', { foz: String })
  const bPath = path('/[foz]', { foz: String })

  const action: () => void = () => combinePath(aPath, bPath)

  expect(action).toThrow(DuplicateParamsError)
})