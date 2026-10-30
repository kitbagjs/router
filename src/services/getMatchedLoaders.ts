import { CreatedRouteOptions } from '@/types/route'
import { AnyLoader } from '@/types/loader'
import { ValueLocation } from '@/services/getComputations'

export function getMatchedLoaders(matches: CreatedRouteOptions[]): { loader: AnyLoader, location: ValueLocation<'loader'> }[] {
  return matches.flatMap((match) => Object.entries(match.loaders).map(([name, loader]) => ({
    loader,
    location: { kind: 'loader', id: match.id, name },
  })))
}
