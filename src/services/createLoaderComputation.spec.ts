import { afterEach, expect, test, vi } from 'vitest'
import { createLoaderComputation } from '@/services/createLoaderComputation'
import * as callbackRoute from '@/services/createCallbackRoute'
import * as callbackContext from '@/services/createRouteCallbackContext'
import { LoaderDataAccessError } from '@/errors/loaderDataAccessError'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'

afterEach(() => {
  vi.restoreAllMocks()
})

test.each([{ value: 'sync' }, Promise.resolve({ value: 'async' })])('passes the prepared route and context and preserves the callback result', (value) => {
  const to = createResolvedRoute(createRoute({ path: '/' }))
  const context = { to, signal: new AbortController().signal, getValue: vi.fn() }
  const routeFactory = vi.spyOn(callbackRoute, 'createCallbackRoute')
  const contextFactory = vi.spyOn(callbackContext, 'createRouteCallbackContext')
  const callback = vi.fn().mockReturnValue(value)
  const computation = createLoaderComputation({ location: { kind: 'loader', depth: 0, name: 'default' }, route: to, callback })

  expect(callback).not.toHaveBeenCalled()
  expect(computation.run(context)).toBe(value)
  expect(contextFactory).toHaveBeenCalledExactlyOnceWith(0, context)
  expect(callback).toHaveBeenCalledExactlyOnceWith(routeFactory.mock.results[0].value, contextFactory.mock.results[0].value)
})

test.each(['getData', 'data'] as const)('rejects access to its own route %s', (property) => {
  const to = createResolvedRoute(createRoute({ path: '/' }).addLoader(() => 'data'))
  const getValue = vi.fn()
  const callback = vi.fn((route) => Reflect.get(route, property))
  const computation = createLoaderComputation({ location: { kind: 'loader', depth: 0, name: 'default' }, route: to, callback })

  expect(() => computation.run({ to, signal: new AbortController().signal, getValue })).toThrow(LoaderDataAccessError)
  expect(getValue).not.toHaveBeenCalled()
})
