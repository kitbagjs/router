import { getDataKey } from '@/services/getDataKey'
import { Computation } from '@/services/getComputations'
import { getFallbackLoaderLocation } from '@/services/getFallbackLoaderLocation'
import { AnyLoader, LoaderInternal } from '@/types/loader'
import { ResolvedRoute } from '@/types/resolved'

export function getFallbackLoaderComputation(loader: AnyLoader & LoaderInternal, route: ResolvedRoute): Computation {
  const location = getFallbackLoaderLocation(loader)

  return {
    ...location,
    key: getDataKey(location.kind, location.id, location.name, route),
    depth: 0,
    run: loader.load,
    routePrefetch: undefined,
    prefetch: loader.prefetch,
    transformer: loader.transformer,
  }
}
