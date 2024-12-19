import { ResolvedRoute } from '@/types/resolved'
import { RouterResolveOptions } from '@/types/RouterResolve'
import { getMatchesForUrl } from '@/services/getMatchesForUrl'
import { getRouteParamValues } from '@/services/paramValidation'
import { Routes } from '@/types/route'
import { parseUrl } from '@/services/urlParser'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { getStateValues } from '@/services/state'
import { asUrl } from '@/types/url'

export function createResolvedRouteForUrl(routes: Routes, url: string, options: RouterResolveOptions = {}): ResolvedRoute | undefined {
  const matches = getMatchesForUrl(routes, url)

  if (!matches.length) {
    return undefined
  }

  const [route] = matches
  const { searchParams, hash } = parseUrl(url)

  return {
    id: route.id,
    matched: route.matched,
    matches: route.matches,
    name: route.name,
    query: createResolvedRouteQuery(searchParams),
    params: getRouteParamValues(route, url),
    state: getStateValues(route.state, options.state),
    hash,
    href: asUrl(url),
  }
}
