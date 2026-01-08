import { expect, test } from 'vitest'
import { MissingRouteContextError } from '@/errors/missingRouteContextError'
import { checkMissingContext } from '@/utilities/checkMissingContext'
import { createRoute } from '@/services/createRoute'
import { createRejection } from '@/services/createRejection'
import { createDiscoveredRoute } from '@/services/createDiscoveredRoute'

test('given all routes without context, does nothing', () => {
  const routes = [
    createRoute({ name: 'foo' }),
    createRoute({ name: 'bar' }),
    createRoute({ name: 'zoo' }),
  ]

  const action: () => void = () => {
    checkMissingContext(routes)
  }

  expect(action).not.toThrow()
})

test('given routes with context that is only rejections, does nothing', () => {
  const routes = [
    createRoute({ name: 'foo', context: [createRejection({ type: 'FooRejection' })] }),
    createRoute({ name: 'bar', context: [createRejection({ type: 'BarRejection' })] }),
    createRoute({ name: 'zoo', context: [createRejection({ type: 'ZooRejection' })] }),
  ]

  const action: () => void = () => {
    checkMissingContext(routes)
  }

  expect(action).not.toThrow()
})

test('given routes with context that are routes but routes are supplied, does nothing', () => {
  const relatedRoute = createRoute({ name: 'related' })
  const routes = [
    createRoute({ name: 'foo', context: [relatedRoute] }),
    createRoute({ name: 'bar', context: [relatedRoute] }),
    createRoute({ name: 'zoo', context: [relatedRoute] }),
  ]

  const action: () => void = () => {
    checkMissingContext([...routes, relatedRoute])
  }

  expect(action).not.toThrow()
})

test('given routes with context that are routes where routes are NOT supplied, return ProtectedRoutes for each missing route', () => {
  const relatedRoute = createRoute({ name: 'related' })
  const routes = [
    createRoute({ name: 'foo', context: [relatedRoute] }),
    createRoute({ name: 'bar', context: [relatedRoute] }),
    createRoute({ name: 'zoo', context: [relatedRoute] }),
  ]

  const missingRoutes = checkMissingContext(routes)

  expect(missingRoutes).toMatchObject([
    createDiscoveredRoute(relatedRoute),
  ])
})
