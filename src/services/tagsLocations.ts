import { CreatedRouteOptions } from '@/types/route'
import { ValueLocation } from '@/types/computation'

export function tagsLocations(match: CreatedRouteOptions, depth: number): ValueLocation<'tags'>[] {
  if (!match.tags) {
    return []
  }

  return [{ kind: 'tags', depth, name: 'tags' }]
}
