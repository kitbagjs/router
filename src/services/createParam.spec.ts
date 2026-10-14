import { expect, test } from 'vitest'
import { arrayOf, createParam, isParam, literal, tupleOf, unionOf, withDefault } from '@/main'

test('param factories return recognized params, while plain get/set options are inputs', () => {
  const options = { get: Number, set: String }
  const params = [
    createParam(options),
    literal('active'),
    arrayOf([Number]),
    tupleOf([Number, String]),
    unionOf([Number, String]),
    withDefault(Number, 1),
  ]

  expect(isParam(options)).toBe(false)

  for (const param of params) {
    expect(isParam(param)).toBe(true)
  }
})
