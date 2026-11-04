import { viewNamesWithProps } from '@/services/routeViews'
import { CreatedRouteOptions } from '@/types/route'
import { ValueLocation } from '@/types/computation'

/**
 * Only views with a getter, since a view with none is never computed and waiting on it would never settle.
 */
export function propsLocations(match: CreatedRouteOptions, depth: number): ValueLocation<'props'>[] {
  return viewNamesWithProps(match.views).map((name) => ({ kind: 'props', depth, name }))
}
