import { afterEach, expect, test, vi } from 'vitest'
import { createRouteCallbackContext } from '@/services/createRouteCallbackContext'
import * as routerContext from '@/services/createRouterCallbackContext'
import * as callbackParent from '@/services/getCallbackParent'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'

afterEach(() => {
  vi.restoreAllMocks()
})

test('provides navigation controls, the computation signal, and its parent', () => {
  const parent = createRoute({ path: '/' })
  const to = createResolvedRoute(createRoute({ parent, path: 'child' }))
  const context = { to, signal: new AbortController().signal, getValue: vi.fn() }
  const controlsFactory = vi.spyOn(routerContext, 'createRouterCallbackContext')
  const parentFactory = vi.spyOn(callbackParent, 'getCallbackParent')
  const result = createRouteCallbackContext(1, context)
  const { push, replace, reject, update } = controlsFactory.mock.results[0].value

  expect(controlsFactory).toHaveBeenCalledExactlyOnceWith({ to })
  expect(parentFactory).toHaveBeenCalledExactlyOnceWith(1, context)
  expect(result).toEqual({ push, replace, reject, update, signal: context.signal, parent: parentFactory.mock.results[0].value })
})
