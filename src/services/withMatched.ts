import { Route } from '@/types/route'

/**
 * Derives `matched` from the last entry of `matches`, which is what the `Route` type already says it is.
 * Everything that builds or rebuilds a route goes through this, so the two can never disagree — `matched`
 * is only ever an output.
 */
export function withMatched<TRoute extends Omit<Route, 'matched'>>(route: TRoute): TRoute & Pick<Route, 'matched'> {
  return {
    ...route,
    matched: route.matches[route.matches.length - 1],
  }
}
