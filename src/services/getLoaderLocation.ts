import { ResolvedRoute } from '@/types/resolved'
import { AnyLoader } from '@/types/loader'
import { ValueLocation } from '@/services/getComputations'
import { isSameLoader } from '@/services/isSameLoader'

export function getLoaderLocation(route: ResolvedRoute, source: AnyLoader): ValueLocation | undefined {
  const locations: ValueLocation[] = []

  for (const match of route.matches) {
    for (const [name, loader] of Object.entries(match.loaders)) {
      if (!isSameLoader(loader, source)) {
        continue
      }

      const location: ValueLocation = {
        kind: 'loader',
        id: match.id,
        name,
      }

      if (loader === source) {
        return location
      }

      locations.push(location)
    }
  }

  if (locations.length > 1) {
    throw new Error('This loader has multiple attachments on the current route. Pass a definition from route.loaders to useLoader.')
  }

  return locations[0]
}
