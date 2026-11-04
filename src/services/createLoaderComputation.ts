import { LoaderDataAccessError } from '@/errors/loaderDataAccessError'
import { createComputation } from '@/services/createComputation'
import { createRouteCallbackContext } from '@/services/createRouteCallbackContext'
import { Computation, CreateRouteComputationOptions } from '@/types/computation'

export function createLoaderComputation(options: CreateRouteComputationOptions): Computation {
  const { location, callback } = options
  const run: Computation['run'] = (context) => {
    // Loaders read parent data instead: reading their own route could create circular dependencies.
    const route = {
      ...context.to,
      get data(): never {
        throw new LoaderDataAccessError(location.name)
      },
      get getData(): never {
        throw new LoaderDataAccessError(location.name)
      },
    }
    const callbackContext = createRouteCallbackContext(location.depth, context)

    return callback(route, callbackContext)
  }

  return createComputation({ ...options, run })
}
