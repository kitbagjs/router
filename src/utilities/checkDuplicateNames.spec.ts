import { expect, test } from 'vitest'
import { DuplicateNamesError } from '@/errors/duplicateNamesError'
import { checkDuplicateNames } from '@/utilities/checkDuplicateNames'
import { createRoute } from '@/services/createRoute'

test('given routes with all unique names, does nothing', () => {
  const routes = [
    createRoute({ name: 'foo' }),
    createRoute({ name: 'bar' }),
    createRoute({ name: 'zoo' }),
  ]

  const action: () => void = () => {
    checkDuplicateNames(routes)
  }

  expect(action).not.toThrow()
})

test('given routes with duplicate names but same id, does nothing', () => {
  const duplicate = createRoute({ name: 'duplicate' })

  const routes = [
    createRoute({ name: 'foo' }),
    duplicate,
    createRoute({ name: 'bar' }),
    duplicate,
    createRoute({ name: 'zoo' }),
  ]

  const action: () => void = () => {
    checkDuplicateNames(routes)
  }

  expect(action).not.toThrow()
})

test('given routes with duplicate , throws DuplicateNamesError', () => {
  const routes = [
    createRoute({ name: 'foo' }),
    createRoute({ name: 'bar' }),
    createRoute({ name: 'zoo' }),
    createRoute({ name: 'bar' }),
    createRoute({ name: 'foo' }),
  ]
  const action: () => void = () => {
    checkDuplicateNames(routes)
  }

  expect(action).toThrow(DuplicateNamesError)
})
