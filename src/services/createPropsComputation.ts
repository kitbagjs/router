import { createCallbackRoute } from '@/services/createCallbackRoute'
import { createComputation } from '@/services/createComputation'
import { createRouteCallbackContext } from '@/services/createRouteCallbackContext'
import { Computation, CreateRouteComputationOptions } from '@/types/computation'

export function createPropsComputation(options: CreateRouteComputationOptions): Computation {
  const { location, callback } = options
  const run: Computation['run'] = (context) => {
    const route = createCallbackRoute(context)
    const callbackContext = createRouteCallbackContext(location.depth, context)

    return callback(route, callbackContext)
  }

  return createComputation({ ...options, run })
}
