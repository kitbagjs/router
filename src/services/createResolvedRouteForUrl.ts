import { ResolvedRoute } from '@/types/resolved'
import { getMatchesForUrl } from '@/services/getMatchesForUrl'
import { Routes } from '@/types/route'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { getStateValues } from '@/services/state'
import { asUrlString } from '@/types/urlString'

export function createResolvedRouteForUrl(routes: Routes, url: string, state?: Partial<unknown>): ResolvedRoute | undefined {
  const matches = getMatchesForUrl(routes, url)

  if (!matches.length) {
    return undefined
  }

  const [route] = matches
  const asUrl = new URL(url)

  return {
    id: route.id,
    matched: route.matched,
    matches: route.matches,
    name: route.name,
    hooks: route.hooks,
    query: createResolvedRouteQuery(asUrl.searchParams),
    params: route.parse(url),
    state: getStateValues(route.state, state),
    hash: asUrl.hash,
    href: asUrlString(url),
  }
}
