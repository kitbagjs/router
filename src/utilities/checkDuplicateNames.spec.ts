import { expect, test } from 'vitest'
import { checkDuplicateNames } from '@/utilities/checkDuplicateNames'

test('given a single array without duplicates, does nothing', () => {
  const input = ['foo', 'bar', 'zoo']

  const action: () => void = () => checkDuplicateNames(input)

  expect(action).not.toThrow()
})

// test.each([
//   [['foo', 'bar', 'zoo', 'bar']],
//   [['foo', 'bar', 'zoo'], ['jar', 'zoo']],
//   [['foo', 'bar', 'zoo'], ['jar'], ['zoo']],
// ])('given a multiple arrays with duplicates, throws DuplicateParamsError', (...arrays) => {
//   const action: () => void = () => checkDuplicateNames(arrays)

//   expect(action).toThrow(DuplicateParamsError)
// })

// test.each([
//   [['foo', 'bar', 'zoo']],
//   [['foo', 'bar', 'zoo'], ['jar']],
//   [['foo', 'bar'], ['jar'], ['zoo']],
// ])('given a multiple arrays without duplicates, does nothing', () => {
//   const aArray = ['foo', 'bar', 'zoo']
//   const bArray = ['jar']

//   const action: () => void = () => checkDuplicateNames(aArray, bArray)

//   expect(action).not.toThrow()
// })