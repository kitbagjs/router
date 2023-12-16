import { describe, expect, test } from 'vitest'
import { PathParams } from '@/types'
import { mergeParams } from '@/utilities'

describe('mergeParams', () => {
  test('given params without overlap, returns combination of both', () => {
    const input: PathParams[] = [
      {
        foo: [String],
        bar: [String],
      },
      {
        zoo: [String],
      },
    ]

    const response = mergeParams(...input)

    expect(response).toHaveProperty('foo')
    expect(response).toHaveProperty('bar')
    expect(response).toHaveProperty('zoo')
  })

  test('given params with overlap of same type, does not combine into new tuple', () => {
    const input: PathParams[] = [
      {
        foo: [String],
      },
      {
        foo: [String],
      },
    ]

    const response = mergeParams(...input)

    expect(response).toHaveProperty('foo')
    expect(response.foo).toMatchObject([String])
  })

  test('given params with overlap of different types, combines overlapped into new tuple', () => {
    const input: PathParams[] = [
      {
        foo: [String],
      },
      {
        foo: [Number],
      },
    ]

    const response = mergeParams(...input)

    expect(response).toHaveProperty('foo')
    expect(response.foo).toMatchObject([String, Number])
  })
})