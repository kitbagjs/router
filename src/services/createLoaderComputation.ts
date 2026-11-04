import { getDataKey } from '@/services/getDataKey'
import { createRouterCallbackContext } from '@/services/createRouterCallbackContext'
import { getCallbackParent } from '@/services/getCallbackParent'
import { Computation, CreateComputationOptions, ValueLocation } from '@/types/computation'
import { ResolvedRoute } from '@/types/resolved'

type LoaderComputationContext = {
  to: ResolvedRoute,
  signal: AbortSignal,
  getValue: (location: ValueLocation) => Promise<unknown>,
}

export function createLoaderComputation(options: CreateComputationOptions<'loader'>): Computation<LoaderComputationContext> {
  const { location, route, callback, routePrefetch, prefetch, transformer } = options
  const key = getDataKey({ ...location, route })
  const prefetchKey = 'loaders'
  const run = (context: LoaderComputationContext): unknown => {
    const { to, signal } = context
    const { push, replace, reject, update } = createRouterCallbackContext({ to })
    const parent = getCallbackParent(location.depth, context)

    return callback(to, { push, replace, reject, update, signal, parent })
  }

  return { ...location, key, prefetchKey, run, routePrefetch, prefetch, transformer }
}
