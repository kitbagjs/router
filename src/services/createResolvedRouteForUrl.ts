import { getRouteParamValues } from '@/services/paramValidation'
import { ResolvedRoute } from '@/types/resolved'
import { Routes } from '@/types/route'
import { parseUrl } from './urlParser'
import { createResolvedRouteQuery } from './createResolvedRouteQuery'
import { getStateValues } from './state'
import { asUrl } from '@/types'
import { getMatchesForUrl } from './getMatchesForUrl'

export function createResolvedRouteForUrl(routes: Routes, url: string, state?: unknown): ResolvedRoute | undefined {
  const matches = getMatchesForUrl(routes, url)

  if (matches.length === 0) {
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
    state: getStateValues(route.state, state),
    hash,
    href: asUrl(url),
  }
}
