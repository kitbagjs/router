import { ComputationStore } from '@/services/createComputationStore'
import { getLoaderComputation } from '@/services/getLoaderComputation'
import { ComputationContext, ValueLocation } from '@/types/computation'
import { ResolvedRoute } from '@/types/resolved'

/**
 * Starts a requested registration and any loader dependencies it reads in the same store.
 */
export function computeLoader(store: ComputationStore, route: ResolvedRoute, name: string): void {
  const computation = getLoaderComputation(route, name)

  function run(context: ComputationContext): unknown {
    function getValue(location: ValueLocation): Promise<unknown> {
      const state = store.getState(location, route)

      if (location.kind === 'loader' && (state.status === 'MISSING' || state.status === 'PENDING')) {
        computeLoader(store, route, location.name)
      }

      return context.getValue(location)
    }

    return computation.run({ ...context, getValue })
  }

  store.compute(route, [{ ...computation, run }])
}
