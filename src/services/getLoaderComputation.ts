import { Computation } from '@/types/computation'
import { ResolvedRoute } from '@/types/resolved'
import { getRouteLoaderLocation } from '@/services/getRouteLoaderLocation'
import { createLoaderComputation } from '@/services/createLoaderComputation'

export function getLoaderComputation(route: ResolvedRoute, name: string): Computation {
  const location = getRouteLoaderLocation(route, name)
  const loader = route.loaders[name]

  return createLoaderComputation({
    location,
    route,
    callback: loader.load,
    routePrefetch: route.matches[location.depth].prefetch,
    prefetch: loader.prefetch,
    transformer: loader.transformer,
  })
}
