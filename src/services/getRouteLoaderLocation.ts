import { ResolvedRoute } from '@/types/resolved'
import { CreatedRouteOptions } from '@/types/route'
import { getMatchedLoaders } from '@/services/getMatchedLoaders'
import { ValueLocation } from '@/services/getComputations'

export function getRouteLoaderLocation(route: ResolvedRoute, name: string, matches: CreatedRouteOptions[] = route.matches): ValueLocation<'loader'> {
  const loader = getMatchedLoaders(matches).find(({ location }) => location.name === name)

  if (!loader) {
    throw new TypeError(`Route "${route.name}" has no loader named "${name}"`)
  }

  return loader.location
}
