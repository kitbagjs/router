import { describe, expect, test } from 'vitest'
import { getStateValues, setStateValues } from '@/services/state'
import { withDefault } from '@/services/withDefault'

describe('setStateValues', () => {
  test.each([
    [null],
    [undefined],
    ['{}'],
    [[]],
  ])('given state that is not expected format, returns empty object', (state) => {
    const params = {
      foo: Number,
    }

    const response = setStateValues(params, state)

    expect(response).toMatchObject({})
  })

  test('given state missing the expected key, returns empty string', () => {
    const params = {
      foo: Number,
    }
    const state = {
      bar: 'abc',
    }

    const response = setStateValues(params, state)

    expect(response).toMatchObject({
      foo: '',
    })
  })

  test('given state with the expected key, returns parsed value', () => {
    const params = {
      foo: Number,
    }
    const state = {
      foo: 456,
    }

    const response = setStateValues(params, state)

    expect(response).toMatchObject({
      foo: '456',
    })
  })
})

describe('getStateValues', () => {
  test.each([
    [null],
    [undefined],
    ['{}'],
    [[]],
  ])('given state that is not expected format, returns empty object', (state) => {
    const params = {
      foo: Number,
    }

    const response = getStateValues(params, state)

    expect(response).toMatchObject({})
  })

  test('given state missing the expected key without default, returns undefined', () => {
    const params = {
      foo: Number,
    }
    const state = {
      bar: 'abc',
    }

    const response = getStateValues(params, state)

    expect(response).toMatchObject({
      foo: undefined,
    })
  })

  test('given state missing the expected key with default, returns default value', () => {
    const params = {
      foo: withDefault(Number, 123),
    }
    const state = {
      bar: 'abc',
    }

    const response = getStateValues(params, state)

    expect(response).toMatchObject({
      foo: 123,
    })
  })

  test('given state with the expected key, returns parsed value', () => {
    const params = {
      foo: Number,
    }
    const state = {
      foo: '456',
    }

    const response = getStateValues(params, state)

    expect(response).toMatchObject({
      foo: 456,
    })
  })
})
