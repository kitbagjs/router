import { expect, test } from 'vitest'
import { DuplicateNamesError } from '@/errors/duplicateNamesError'
import { createRoute } from '@/main'
import { checkDuplicateNames } from '@/utilities/checkDuplicateNames'

test('given a single array without duplicates, does nothing', () => {
  const routes = [
    createRoute({ name: 'foo' }),
    createRoute({ name: 'bar' }),
    createRoute({ name: 'zoo' }),
  ]

  const action: () => void = () => checkDuplicateNames(routes)

  expect(action).not.toThrow()
})

test('given a multiple arrays with duplicates, throws DuplicateParamsError', () => {
  const routes = [
    createRoute({ name: 'foo' }),
    createRoute({ name: 'bar' }),
    createRoute({ name: 'zoo' }),
    createRoute({ name: 'bar' }),
    createRoute({ name: 'foo' }),
  ]
  const action: () => void = () => checkDuplicateNames(routes)

  expect(action).toThrow(DuplicateNamesError)
})