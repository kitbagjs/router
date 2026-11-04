import { afterEach, expect, test, vi } from 'vitest'
import { createLoaderComputation } from '@/services/createLoaderComputation'
import * as routerContext from '@/services/createRouterCallbackContext'
import * as callbackParent from '@/services/getCallbackParent'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { getDataKey } from '@/services/getDataKey'
import { ValueLocation } from '@/types/computation'

afterEach(() => {
  vi.restoreAllMocks()
})

test.each([{ value: 'sync' }, Promise.resolve({ value: 'async' })])('passes the resolved route and context and preserves the callback result', (value) => {
  const parent = createRoute({ path: '/' })
  const to = createResolvedRoute(createRoute({ parent, path: 'child' }))
  const context = { to, signal: new AbortController().signal, getValue: vi.fn() }
  const controlsFactory = vi.spyOn(routerContext, 'createRouterCallbackContext')
  const parentFactory = vi.spyOn(callbackParent, 'getCallbackParent')
  const callback = vi.fn().mockReturnValue(value)
  const location: ValueLocation<'loader'> = { kind: 'loader', depth: 1, name: 'default' }
  const transformer = { stringify: JSON.stringify, parse: JSON.parse }
  const computation = createLoaderComputation({ location, route: to, callback, routePrefetch: 'lazy', prefetch: 'eager', transformer })

  expect(computation).toMatchObject({ ...location, key: getDataKey({ ...location, route: to }), routePrefetch: 'lazy', prefetch: 'eager', transformer })
  expect(callback).not.toHaveBeenCalled()
  const result = computation.run(context)
  const { push, replace, reject, update } = controlsFactory.mock.results[0].value

  const [route] = callback.mock.calls[0]

  expect(result).toBe(value)
  expect(controlsFactory).toHaveBeenCalledExactlyOnceWith({ to })
  expect(parentFactory).toHaveBeenCalledExactlyOnceWith(1, context)
  expect(callback).toHaveBeenCalledExactlyOnceWith(to, { push, replace, reject, update, signal: context.signal, parent: parentFactory.mock.results[0].value })

  expect(route).toBe(to)
  expect('data' in route).toBe(false)
  expect('getData' in route).toBe(false)
  expect(context.getValue).not.toHaveBeenCalled()
})
