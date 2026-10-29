import { ResolvedRoute } from '@/types/resolved'
import { ValueLocation } from '@/services/getComputations'

export function getRouteLoaderLocation(route: ResolvedRoute, name: string): ValueLocation<'loader'> {
  const match = route.matches.find((match) => Object.hasOwn(match.loaders, name))

  if (!match) {
    throw new TypeError(`Route "${route.name}" has no loader named "${name}"`)
  }

  return { kind: 'loader', id: match.id, name }
}
