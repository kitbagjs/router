import { CreatedRouteOptions } from '@/types/route'
import { ValueLocation } from '@/types/computation'

export function loaderLocations(match: CreatedRouteOptions, depth: number): ValueLocation<'loader'>[] {
  return Object.keys(match.loaders).map((name) => ({ kind: 'loader', depth, name }))
}
