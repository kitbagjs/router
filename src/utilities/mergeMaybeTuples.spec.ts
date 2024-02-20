import { expect, test } from 'vitest'
import { Param } from '@/types'
import { mergeMaybeTuples } from '@/utilities'

test('given params without overlap, returns combination of both', () => {
  const input: Record<string, Param[]>[] = [
    {
      foo: [String],
      bar: [String],
    },
    {
      zoo: [String],
    },
  ]

  const response = mergeMaybeTuples(...input)

  expect(response).toHaveProperty('foo')
  expect(response).toHaveProperty('bar')
  expect(response).toHaveProperty('zoo')
})

test('given params with overlap of same type, combines into new tuple', () => {
  const input: Record<string, Param[]>[] = [
    {
      foo: [String],
    },
    {
      foo: [String],
    },
  ]

  const response = mergeMaybeTuples(...input)

  expect(response).toHaveProperty('foo')
  expect(response.foo).toMatchObject([String, String])
})

test('given params with overlap of different types, combines overlapped into new tuple', () => {
  const input: Record<string, Param[]>[] = [
    {
      foo: [String],
    },
    {
      foo: [Number],
    },
  ]

  const response = mergeMaybeTuples(...input)

  expect(response).toHaveProperty('foo')
  expect(response.foo).toMatchObject([String, Number])
})