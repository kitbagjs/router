import { createComputation } from '@/services/createComputation'
import { createRouterCallbackContext } from '@/services/createRouterCallbackContext'
import { getCallbackParent } from '@/services/getCallbackParent'
import { Computation, CreateRouteComputationOptions } from '@/types/computation'

export function createLoaderComputation(options: CreateRouteComputationOptions): Computation {
  const { location, callback } = options
  const run: Computation['run'] = (context) => {
    const { to, signal } = context
    const { push, replace, reject, update } = createRouterCallbackContext({ to })
    const parent = getCallbackParent(location.depth, context)

    return callback(to, { push, replace, reject, update, signal, parent })
  }

  return createComputation({ ...options, run })
}
