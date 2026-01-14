import { ResolvedRoute } from '@/types/resolved'
import { getMatchesForUrl } from '@/services/getMatchesForUrl'
import { Routes } from '@/types/route'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { getStateValues } from '@/services/state'
import { createUrl } from '@/services/createUrl'
import { asUrlString } from '@/types/urlString'

export function createResolvedRouteForUrl(routes: Routes, url: string, state?: Partial<unknown>): ResolvedRoute | undefined {
  const matches = getMatchesForUrl(routes, url)

  if (!matches.length) {
    return undefined
  }

  const [route] = matches
  const { query, hash } = createUrl(url)

  return {
    id: route.id,
    matched: route.matched,
    matches: route.matches,
    name: route.name,
    hooks: route.hooks,
    query: createResolvedRouteQuery(query.toString()),
    params: route.parse(url),
    state: getStateValues(route.state, state),
    hash: hash.toString(),
    href: asUrlString(url),
  }
}
