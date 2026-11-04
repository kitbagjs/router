import { createCallbackRoute } from '@/services/createCallbackRoute'
import { getDataKey } from '@/services/getDataKey'
import { createRouteTags } from '@/services/createRouteTags'
import { getCallbackParent } from '@/services/getCallbackParent'
import { Computation, CreateComputationOptions } from '@/types/computation'
import { isPromise } from '@/utilities/promises'

export function createTagsComputation(options: CreateComputationOptions<'tags'>): Computation {
  const { location, route, callback, routePrefetch, prefetch, transformer } = options
  const key = getDataKey({ ...location, route })
  const prefetchKey = 'tags'
  const run: Computation['run'] = (context) => {
    const { to, signal, getValue } = context
    const route = createCallbackRoute(context)
    const parent = getCallbackParent(location.depth, context)
    const tags = createRouteTags({ route: to, depth: location.depth, getValue })
    const result = callback(tags, { to: route, signal, parent })

    if (isPromise(result)) {
      return result.then(() => tags.operations)
    }

    return tags.operations
  }

  return { ...location, key, prefetchKey, run, routePrefetch, prefetch, transformer }
}
