import { createRoute } from '@/services/createRoute'
import { expect, test } from 'vitest'
import { checkUrlAssemblesValidUrl } from './checkUrlAssemblesValidUrl'
import { InvalidRouteUrlError } from '@/errors/invalidRouteUrlError'

test('given an array with all valid urls, does nothing', () => {
  const routes = [
    createRoute({ name: 'foo', path: '/foo' }),
    createRoute({ name: 'bar', path: '/bar' }),
    createRoute({ name: 'zoo', path: '/zoo' }),
  ]

  const action: () => void = () => {
    checkUrlAssemblesValidUrl(routes)
  }

  expect(action).not.toThrow()
})

test('given an array with potentially invalid valid urls but has dynamic params, does nothing', () => {
  const routes = [
    createRoute({ name: 'foo', path: 'foo[maybe-slash]' }),
    createRoute({ name: 'bar', path: '[maybe-slash]bar' }),
    createRoute({ name: 'zoo', path: 'zo[maybe-slash]oo' }),
  ]

  const action: () => void = () => {
    checkUrlAssemblesValidUrl(routes)
  }

  expect(action).not.toThrow()
})

test('given an array with invalid urls, throws InvalidRouteUrlError', () => {
  const routes = [
    createRoute({ name: 'foo', path: 'foo' }),
    createRoute({ name: 'bar', path: 'bar' }),
    createRoute({ name: 'zoo', path: 'zoo' }),
  ]
  const action: () => void = () => {
    checkUrlAssemblesValidUrl(routes)
  }

  expect(action).toThrow(InvalidRouteUrlError)
})
