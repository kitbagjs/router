import { afterEach, expect, test, vi } from 'vitest'
import { createPropsComputation } from '@/services/createPropsComputation'
import * as callbackRoute from '@/services/createCallbackRoute'
import * as routerContext from '@/services/createRouterCallbackContext'
import * as callbackParent from '@/services/getCallbackParent'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { getDataKey } from '@/services/getDataKey'
import { ValueLocation } from '@/types/computation'

afterEach(() => {
  vi.restoreAllMocks()
})

test.each([{ value: 'sync' }, Promise.resolve({ value: 'async' })])('passes the prepared route and context and preserves the callback result', (value) => {
  const parent = createRoute({ path: '/' })
  const to = createResolvedRoute(createRoute({ parent, path: 'child' }))
  const context = { to, signal: new AbortController().signal, getValue: vi.fn() }
  const routeFactory = vi.spyOn(callbackRoute, 'createCallbackRoute')
  const controlsFactory = vi.spyOn(routerContext, 'createRouterCallbackContext')
  const parentFactory = vi.spyOn(callbackParent, 'getCallbackParent')
  const callback = vi.fn().mockReturnValue(value)
  const location: ValueLocation<'props'> = { kind: 'props', depth: 1, name: 'default' }
  const transformer = { stringify: JSON.stringify, parse: JSON.parse }
  const computation = createPropsComputation({ location, route: to, callback, routePrefetch: 'lazy', prefetch: 'eager', transformer })

  expect(computation).toMatchObject({ ...location, key: getDataKey({ ...location, route: to }), prefetchKey: 'props', routePrefetch: 'lazy', prefetch: 'eager', transformer })
  expect(callback).not.toHaveBeenCalled()
  const result = computation.run(context)
  const { push, replace, reject, update } = controlsFactory.mock.results[0].value

  expect(result).toBe(value)
  expect(controlsFactory).toHaveBeenCalledExactlyOnceWith({ to })
  expect(parentFactory).toHaveBeenCalledExactlyOnceWith(1, context)
  expect(callback).toHaveBeenCalledExactlyOnceWith(routeFactory.mock.results[0].value, { push, replace, reject, update, signal: context.signal, parent: parentFactory.mock.results[0].value })
})
