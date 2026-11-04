import { ValueLocation } from '@/types/computation'
import { CreatedRouteOptions } from '@/types/route'
import { AnyLoader } from '@/types/loader'

export function getMatchedLoaders(matches: CreatedRouteOptions[]): { loader: AnyLoader, location: ValueLocation<'loader'> }[] {
  return matches.flatMap((match, depth) => Object.entries(match.loaders).map(([name, loader]) => ({
    loader,
    location: { kind: 'loader', depth, name },
  })))
}
