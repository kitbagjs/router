import { createCallbackRoute } from '@/services/createCallbackRoute'
import { createComputation } from '@/services/createComputation'
import { createRouteTags } from '@/services/createRouteTags'
import { getCallbackParent } from '@/services/getCallbackParent'
import { Computation, CreateRouteComputationOptions } from '@/types/computation'
import { isPromise } from '@/utilities/promises'

export function createTagsComputation(options: CreateRouteComputationOptions): Computation {
  const { location, callback } = options
  const run: Computation['run'] = (context) => {
    const { to, signal, subscribe } = context
    const route = createCallbackRoute(context)
    const parent = getCallbackParent(location.depth, context)
    const tags = createRouteTags({ route: to, depth: location.depth, subscribe })
    const result = callback(tags, { to: route, signal, parent })

    if (isPromise(result)) {
      return result.then(() => tags.operations)
    }

    return tags.operations
  }

  return createComputation({ ...options, run })
}
