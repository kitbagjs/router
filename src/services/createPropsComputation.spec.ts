import { afterEach, expect, test, vi } from 'vitest'
import { createPropsComputation } from '@/services/createPropsComputation'
import * as callbackRoute from '@/services/createCallbackRoute'
import * as callbackContext from '@/services/createRouteCallbackContext'
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
  const computation = createPropsComputation({ location: { kind: 'props', depth: 0, name: 'default' }, route: to, callback })

  expect(callback).not.toHaveBeenCalled()
  expect(computation.run(context)).toBe(value)
  expect(contextFactory).toHaveBeenCalledExactlyOnceWith(0, context)
  expect(callback).toHaveBeenCalledExactlyOnceWith(routeFactory.mock.results[0].value, contextFactory.mock.results[0].value)
})
