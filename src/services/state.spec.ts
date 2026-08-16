import { describe, expect, test } from 'vitest'
import { getMatchStates, getStateValues, resolveMatchStates, setMatchStates, setStateValues } from '@/services/state'
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

describe('setMatchStates', () => {
  test('serializes state per match', () => {
    const matches: { state: Record<string, typeof String | typeof Number> }[] = [
      { state: { foo: String } },
      { state: { foo: Number, bar: Number } },
    ]

    const result = setMatchStates(matches, { foo: 42, bar: 10 })

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ foo: '42' })
    expect(result[1]).toMatchObject({ foo: '42', bar: '10' })
  })
})

describe('getMatchStates', () => {
  test('given per-match array, deserializes each match independently', () => {
    const matches = [
      { state: { foo: String } },
      { state: { foo: Number } },
    ]
    const stored = [
      { foo: '42' },
      { foo: '42' },
    ]

    const result = getMatchStates(matches, stored)

    expect(result[0]).toMatchObject({ foo: '42' })
    expect(result[1]).toMatchObject({ foo: 42 })
  })

  test('given flat state object, distributes to all matches', () => {
    const matches = [
      { state: { foo: String } },
      { state: { foo: Number } },
    ]

    const result = getMatchStates(matches, { foo: 42 })

    expect(result[0]).toMatchObject({ foo: 42 })
    expect(result[1]).toMatchObject({ foo: 42 })
  })
})

describe('resolveMatchStates', () => {
  test('merges match states with later matches overriding', () => {
    const matchStates = [
      { foo: 'hello', bar: 'world' },
      { foo: 42 },
    ]

    const result = resolveMatchStates(matchStates)

    expect(result).toMatchObject({ foo: 42, bar: 'world' })
  })

  test('given upToIndex, only includes matches up to that index', () => {
    const matchStates = [
      { foo: 'hello', bar: 'world' },
      { foo: 42 },
    ]

    const result = resolveMatchStates(matchStates, 0)

    expect(result).toMatchObject({ foo: 'hello', bar: 'world' })
    expect(result).not.toHaveProperty('baz')
  })
})
