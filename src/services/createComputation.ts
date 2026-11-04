import { getDataKey } from '@/services/getDataKey'
import { AnyPayloadTransformer } from '@/services/payload'
import { Computation, ValueLocation } from '@/types/computation'
import { PrefetchConfig } from '@/types/prefetch'
import { ResolvedRoute } from '@/types/resolved'

type CreateComputationOptions = {
  location: ValueLocation,
  route: ResolvedRoute,
  run: Computation['run'],
  routePrefetch?: PrefetchConfig,
  prefetch?: PrefetchConfig,
  transformer?: AnyPayloadTransformer,
}

export function createComputation({ location, route, run, routePrefetch, prefetch, transformer }: CreateComputationOptions): Computation {
  const key = getDataKey({ ...location, route })
  const computation = {
    ...location,
    key,
    run,
    routePrefetch,
    prefetch,
    transformer,
  }

  return computation
}
