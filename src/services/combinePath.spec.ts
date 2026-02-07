import { expect, test } from 'vitest'
import { DuplicateParamsError } from '@/errors/duplicateParamsError'
import { combinePath } from '@/services/combinePath'
import { withParams } from '@/services/withParams'

test('given 2 paths, returns new Path joined together', () => {
  const aPath = withParams('/foo', {})
  const bPath = withParams('/bar', {})

  const response = combinePath(aPath, bPath)

  expect(response.value).toBe('/foo/bar')
})

test('given 2 paths with params, returns new Path joined together with params', () => {
  const aPath = withParams('/[foz]', { foz: Boolean })
  const bPath = withParams('/[baz]', { baz: Number })

  const response = combinePath(aPath, bPath)

  expect(response.value).toBe('/[foz]/[baz]')
  expect(response.params).toMatchObject({
    foz: [Boolean, { isOptional: false, isGreedy: false }],
    baz: [Number, { isOptional: false, isGreedy: false }],
  })
})

test('given 2 paths with optional params, returns new Path joined together with params', () => {
  const aPath = withParams('/[?foz]', { foz: Boolean })
  const bPath = withParams('/[?baz]', { baz: Number })

  const response = combinePath(aPath, bPath)

  expect(response.value).toBe('/[?foz]/[?baz]')
  expect(response.params).toMatchObject({
    foz: [Boolean, { isOptional: true, isGreedy: false }],
    baz: [Number, { isOptional: true, isGreedy: false }],
  })
})

test('given 2 paths with params that include duplicates, throws DuplicateParamsError', () => {
  const aPath = withParams('/[foz]', { foz: String })
  const bPath = withParams('/[foz]', { foz: String })

  const action: () => void = () => combinePath(aPath, bPath)

  expect(action).toThrow(DuplicateParamsError)
})
