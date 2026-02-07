import { expect, test } from 'vitest'
import { DuplicateParamsError } from '@/errors/duplicateParamsError'
import { combineHash } from '@/services/combineHash'
import { withParams } from '@/services/withParams'

test('given 2 hash, returns new Hash joined together', () => {
  const aHash = withParams('/foo', {})
  const bHash = withParams('/bar', {})

  const response = combineHash(aHash, bHash)

  expect(response.value).toBe('/foo/bar')
})

test('given 2 hash with params, returns new Hash joined together with params', () => {
  const aHash = withParams('/[foz]', { foz: Boolean })
  const bHash = withParams('/[baz]', { baz: Number })

  const response = combineHash(aHash, bHash)

  expect(response.value).toBe('/[foz]/[baz]')
  expect(response.params).toMatchObject({
    foz: [Boolean, { isOptional: false, isGreedy: false }],
    baz: [Number, { isOptional: false, isGreedy: false }],
  })
})

test('given 2 hash with optional params, returns new Hash joined together with params', () => {
  const aHash = withParams('/[?foz]', { foz: Boolean })
  const bHash = withParams('/[?baz]', { baz: Number })

  const response = combineHash(aHash, bHash)

  expect(response.value).toBe('/[?foz]/[?baz]')
  expect(response.params).toMatchObject({
    foz: [Boolean, { isOptional: true, isGreedy: false }],
    baz: [Number, { isOptional: true, isGreedy: false }],
  })
})

test('given 2 hash with params that include duplicates, throws DuplicateParamsError', () => {
  const aHash = withParams('/[foz]', { foz: String })
  const bHash = withParams('/[foz]', { foz: String })

  const action: () => void = () => combineHash(aHash, bHash)

  expect(action).toThrow(DuplicateParamsError)
})
