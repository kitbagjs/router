import { afterEach, expect, test, vi } from 'vitest'
import { createPropsComputation } from '@/services/createPropsComputation'
import * as callbackRoute from '@/services/createCallbackRoute'
import * as routerContext from '@/services/createRouterCallbackContext'
import * as callbackParent from '@/services/getCallbackParent'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { ValueLocation } from '@/types/computation'

afterEach(() => {
  vi.restoreAllMocks()
})

test('passes the data-enabled route and callback context', () => {
  const parent = createRoute({ path: '/' })
  const to = createResolvedRoute(createRoute({ parent, path: 'child' }))
  const context = { to, signal: new AbortController().signal, getValue: vi.fn() }
  const routeFactory = vi.spyOn(callbackRoute, 'createCallbackRoute')
  const controlsFactory = vi.spyOn(routerContext, 'createRouterCallbackContext')
  const parentFactory = vi.spyOn(callbackParent, 'getCallbackParent')
  const callback = vi.fn()
  const location: ValueLocation<'props'> = { kind: 'props', depth: 1, name: 'default' }
  const computation = createPropsComputation({ location, route: to, callback })

  expect(callback).not.toHaveBeenCalled()
  computation.run(context)
  const { push, replace, reject, update } = controlsFactory.mock.results[0].value

  expect(routeFactory).toHaveBeenCalledExactlyOnceWith(context)
  expect(controlsFactory).toHaveBeenCalledExactlyOnceWith({ to })
  expect(parentFactory).toHaveBeenCalledExactlyOnceWith(1, context)
  expect(callback).toHaveBeenCalledExactlyOnceWith(routeFactory.mock.results[0].value, {
    push,
    replace,
    reject,
    update,
    signal: context.signal,
    parent: parentFactory.mock.results[0].value,
  })
})
