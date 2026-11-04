import { ValueLocation } from '@/types/computation'
import { ResolvedRoute } from '@/types/resolved'
import { AnyLoader } from '@/types/loader'
import { isSameLoader } from '@/services/isSameLoader'

export type LoaderLocationMissing = { reason: 'missing' }

export type LoaderLocationAmbiguous = {
  reason: 'ambiguous',
  names: string[],
}

export type LoaderLocationSuccess = { location: ValueLocation<'loader'> }

type LoaderLocationResult = LoaderLocationMissing | LoaderLocationAmbiguous | LoaderLocationSuccess

export function getLoaderLocation(route: ResolvedRoute, source: AnyLoader): LoaderLocationResult {
  const locations: ValueLocation<'loader'>[] = []

  for (const [depth, match] of route.matches.entries()) {
    for (const [name, loader] of Object.entries(match.loaders)) {
      if (!isSameLoader(loader, source)) {
        continue
      }

      const location: ValueLocation<'loader'> = {
        kind: 'loader',
        depth,
        name,
      }

      if (loader === source) {
        return { location }
      }

      locations.push(location)
    }
  }

  if (locations.length > 1) {
    return {
      reason: 'ambiguous',
      names: locations.map(({ name }) => name),
    }
  }

  if (locations.length === 0) {
    return { reason: 'missing' }
  }

  const [location] = locations

  return { location }
}
