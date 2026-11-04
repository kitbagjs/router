import { createRouteComputation } from '@/services/createRouteComputation'
import { Computation } from '@/services/getComputations'
import { getFallbackLoaderLocation } from '@/services/getFallbackLoaderLocation'
import { AnyLoader, LoaderInternal } from '@/types/loader'
import { ResolvedRoute } from '@/types/resolved'

export function getFallbackLoaderComputation(loader: AnyLoader & LoaderInternal, route: ResolvedRoute): Computation {
  const location = getFallbackLoaderLocation(loader)

  return createRouteComputation({
    location,
    route,
    callback: loader.load,
    prefetch: loader.prefetch,
    transformer: loader.transformer,
  })
}
