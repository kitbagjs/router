import { createCallbackRoute } from '@/services/createCallbackRoute'
import { getDataKey } from '@/services/getDataKey'
import { createRouterCallbackContext } from '@/services/createRouterCallbackContext'
import { getCallbackParent } from '@/services/getCallbackParent'
import { Computation, CreateComputationOptions } from '@/types/computation'

export function createPropsComputation(options: CreateComputationOptions<'props'>): Computation {
  const { location, route, callback, routePrefetch, prefetch, transformer } = options
  const key = getDataKey({ ...location, route })
  const prefetchKey = 'props'
  const run: Computation['run'] = (context) => {
    const { to, signal } = context
    const route = createCallbackRoute(context)
    const { push, replace, reject, update } = createRouterCallbackContext({ to })
    const parent = getCallbackParent(location.depth, context)

    return callback(route, { push, replace, reject, update, signal, parent })
  }

  return { ...location, key, prefetchKey, run, routePrefetch, prefetch, transformer }
}
