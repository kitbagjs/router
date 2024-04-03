import { expect, test } from 'vitest'
import { removePartial } from '@/utilities/removePartial'

test('given record without undefined keys, returns same value given', () => {
  const input = {
    foo: 1,
    bar: 'string',
    baz: null,
    jar: {},
    cap: [20],
  }

  const response = removePartial(input)

  expect(response).toMatchObject(input)
})

test('given record with undefined keys, removes any value that were undefined', () => {
  const clean = {
    foo: 1,
    bar: 'string',
    baz: null,
    jar: {},
    cap: [20],
  }
  const input = {
    ...clean,
    und: undefined,
  }

  const response = removePartial(input)

  expect(response).toMatchObject(clean)
})