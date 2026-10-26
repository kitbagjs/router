import { ResolvedRoute } from '@/types/resolved'
import { AnyLoader } from '@/types/loader'
import { ValueLocation } from '@/services/getComputations'
import { isSameLoader } from '@/services/isSameLoader'

export type LoaderFallbackMissing = { reason: 'missing' }

export type LoaderFallbackAmbiguous = {
  reason: 'ambiguous',
  names: string[],
}

export type LoaderFallback = LoaderFallbackMissing | LoaderFallbackAmbiguous

type LoaderLocationResult = { location: ValueLocation<'loader'> } | LoaderFallback

export function getLoaderLocation(route: ResolvedRoute, source: AnyLoader): LoaderLocationResult {
  const locations: ValueLocation<'loader'>[] = []

  for (const match of route.matches) {
    for (const [name, loader] of Object.entries(match.loaders)) {
      if (!isSameLoader(loader, source)) {
        continue
      }

      const location: ValueLocation<'loader'> = {
        kind: 'loader',
        id: match.id,
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
