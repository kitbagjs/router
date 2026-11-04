import { getDataKey } from '@/services/getDataKey'
import { createRouterCallbackContext } from '@/services/createRouterCallbackContext'
import { getCallbackParent } from '@/services/getCallbackParent'
import { Computation, CreateComputationOptions } from '@/types/computation'

export function createLoaderComputation(options: CreateComputationOptions<'loader'>): Computation {
  const { location, route, callback, routePrefetch, prefetch, transformer } = options
  const key = getDataKey({ ...location, route })
  const run: Computation['run'] = (context) => {
    const { to, signal } = context
    const { push, replace, reject, update } = createRouterCallbackContext({ to })
    const parent = getCallbackParent(location.depth, context)

    return callback(to, { push, replace, reject, update, signal, parent })
  }

  return { ...location, key, run, routePrefetch, prefetch, transformer }
}
