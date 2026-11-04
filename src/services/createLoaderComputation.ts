import { LoaderDataAccessError } from '@/errors/loaderDataAccessError'
import { createCallbackRoute } from '@/services/createCallbackRoute'
import { createComputation } from '@/services/createComputation'
import { createRouteCallbackContext } from '@/services/createRouteCallbackContext'
import { Computation, CreateRouteComputationOptions } from '@/types/computation'

export function createLoaderComputation(options: CreateRouteComputationOptions): Computation {
  const { location, callback } = options

  // Loaders read parent data instead: reading their own route could create circular dependencies.
  function assertDataAccess(): never {
    throw new LoaderDataAccessError(location.name)
  }

  const run: Computation['run'] = (context) => {
    const route = createCallbackRoute(context, assertDataAccess)
    const callbackContext = createRouteCallbackContext(location.depth, context)

    return callback(route, callbackContext)
  }

  return createComputation({ ...options, run })
}
