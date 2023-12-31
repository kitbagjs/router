import { Route } from '@/types'
import { Resolved } from '@/types/resolved'
import { routeParamsAreValid } from '@/utilities/paramValidation'
import { ResolvedWithRegex } from '@/utilities/resolveRoutesRegex'

export function routeMatch(routes: ResolvedWithRegex[], path: string): Resolved<Route> | undefined {
  const { route } = routes.find(({ regexp, route }) => regexp.test(path) && routeParamsAreValid(path, route)) ?? {}

  return route
}