import { expect, test } from 'vitest'
import { DuplicateParamsError } from '@/errors'
import { checkDuplicateKeys } from '@/utilities/checkDuplicateKeys'

test('given a single array without duplicates, does nothing', () => {
  const input = ['foo', 'bar', 'zoo']

  const action: () => void = () => checkDuplicateKeys(input)

  expect(action).not.toThrow()
})

test.each([
  [['foo', 'bar', 'zoo', 'bar']],
  [['foo', 'bar', 'zoo'], ['jar', 'zoo']],
  [['foo', 'bar', 'zoo'], ['jar'], ['zoo']],
])('given a multiple arrays with duplicates, throws DuplicateParamsError', (...arrays) => {
  const action: () => void = () => checkDuplicateKeys(...arrays)

  expect(action).toThrow(DuplicateParamsError)
})

test.each([
  [['foo', 'bar', 'zoo']],
  [['foo', 'bar', 'zoo'], ['jar']],
  [['foo', 'bar'], ['jar'], ['zoo']],
])('given a multiple arrays without duplicates, does nothing', () => {
  const aArray = ['foo', 'bar', 'zoo']
  const bArray = ['jar']

  const action: () => void = () => checkDuplicateKeys(aArray, bArray)

  expect(action).not.toThrow()
})

test.each([
  [{ foo: 'foo', var: 'bar', zoo: 'zoo' }, { jar: 'jar', zoo: 'zoo' }],
  [{ foo: 'foo', var: 'bar', zoo: 'zoo' }, { jar: 'jar' }, { zoo: 'zoo' }],
])('given multiple records with duplicates keys, throws DuplicateParamsError', (...records) => {
  const action: () => void = () => checkDuplicateKeys(...records)

  expect(action).toThrow(DuplicateParamsError)
})

test.each([
  [{ foo: 'foo', var: 'bar', zoo: 'zoo' }, { jar: 'jar' }],
  [{ foo: 'foo', var: 'bar' }, { jar: 'jar' }, { zoo: 'zoo' }],
])('given multiple records without duplicates keys, does nothing', () => {
  const aRecord = { foo: 'foo', var: 'bar' }
  const bRecord = { jar: 'jar', zoo: 'zoo' }

  const action: () => void = () => checkDuplicateKeys(aRecord, bRecord)

  expect(action).not.toThrow()
})