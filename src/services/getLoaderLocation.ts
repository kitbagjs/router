import { RouterRoute } from '@/types/routerRoute'
import { AnyLoader } from '@/types/loader'
import { isLoaderHandle, LoaderHandle } from '@/types/loaderHandle'
import { ValueLocation } from '@/services/getComputations'
import { isSameLoader } from '@/services/isSameLoader'

export function getLoaderLocation(route: RouterRoute, source: AnyLoader | LoaderHandle): ValueLocation | undefined {
  if (isLoaderHandle(source)) {
    const match = route.matches.find((match) => match.id === source.matchId && source.name in match.loaders)

    if (!match) {
      throw new Error(`Loader "${source.name}" is not attached to the current route`)
    }

    if (route.loaders[source.name] !== source) {
      throw new TypeError('This loader handle belongs to a different router')
    }

    return { kind: 'loader', id: match.id, name: source.name }
  }

  const locations = route.matches.flatMap((match) => Object.entries(match.loaders)
    .filter(([, loader]) => isSameLoader(loader, source))
    .map(([name]): ValueLocation => ({ kind: 'loader', id: match.id, name })))

  if (locations.length > 1) {
    throw new Error('This loader has multiple attachments on the current route. Pass a route.loaders handle to useLoader.')
  }

  if (locations.length === 0) {
    return
  }

  return locations[0]
}
