import { expect, test } from 'vitest'
import { combineState } from '@/services/combineState'

test('given 2 states, returns new State joined together', () => {
  const aState = { foz: String }
  const bState = { baz: Number }

  const response = combineState(aState, bState)

  expect(response).toMatchObject({
    foz: String,
    baz: Number,
  })
})

test('given 2 states with duplicate keys, child overrides parent', () => {
  const parentState = { foz: String }
  const childState = { foz: Number }

  const response = combineState(parentState, childState)

  expect(response).toMatchObject({
    foz: Number,
  })
})
