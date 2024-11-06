import { expect, test } from 'vitest'
import { DuplicateParamsError } from '@/errors/duplicateParamsError'
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

test('given 2 states with params that include duplicates, throws DuplicateParamsError', () => {
  const aState = { foz: String }
  const bState = { foz: Number }

  const action: () => void = () => combineState(aState, bState)

  expect(action).toThrow(DuplicateParamsError)
})
