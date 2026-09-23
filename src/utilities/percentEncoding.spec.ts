import { expect, test } from 'vitest'
import { decodeParamValue, encodeParamValue } from '@/utilities/percentEncoding'

test('encodes percent signs and square brackets only', () => {
  expect(encodeParamValue('100%')).toBe('100%25')
  expect(encodeParamValue('[id]')).toBe('%5Bid%5D')
  expect(encodeParamValue('a b/c?d#e')).toBe('a b/c?d#e')
})

test('decodes escapes and keeps a malformed escape as written', () => {
  expect(decodeParamValue('100%25')).toBe('100%')
  expect(decodeParamValue('a%2Fb')).toBe('a/b')
  expect(decodeParamValue('100%')).toBe('100%')
  expect(decodeParamValue(undefined)).toBe(undefined)
})
