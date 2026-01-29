import { parseUrl } from '@/services/urlParser'
import { paramRegex, paramIsOptional } from '@/services/routeRegex'
import { Route } from '@/types/route'
import { stringHasValue } from '@/utilities/guards'
import { RouteMatchRule } from '@/types/routeMatchRule'
import { isNamedRoute } from '@/utilities/isNamedRoute'
import { routeHostMatches, routePathMatches, routeQueryMatches, routeHashMatches } from '@/services/routeMatchRules'
import { routeParamsAreValid } from '@/services/paramValidation'

const BASE_SCORE = 35
const PATH_MAX_POINTS = 35
const HOST_MAX_POINTS = 10
const HASH_MAX_POINTS = 10
const QUERY_MAX_POINTS = 10
const OPTIONAL_PARAM_MAX_PENALTY = 10

const PATH_LOG_MAX = 50
const HOST_LOG_MAX = 30
const HASH_LOG_MAX = 20
const QUERY_LOG_MAX = 30

const matchRules: RouteMatchRule[] = [
  isNamedRoute,
  routeHostMatches,
  routePathMatches,
  routeQueryMatches,
  routeHashMatches,
  routeParamsAreValid,
]

export function getRouteScore(route: Route, url: string): number {
  const matches = matchRules.every((rule) => rule(route, url))

  if (!matches) {
    return 0
  }

  const { host, path, query, hash } = parseUrl(url)

  const pathScore = getPathScore(route.path.value, path)
  const hostScore = getHostScore(route.host.value, host)
  const hashScore = getHashScore(route.hash.value, hash)
  const queryScore = getQueryScore(route.query.value, query)
  const optionalParamPenalty = getOptionalParamPenalty(route, url)

  return BASE_SCORE + pathScore + hostScore + hashScore + queryScore - optionalParamPenalty
}

function getPathScore(routePath: string, urlPath: string): number {
  const staticChars = countStaticChars(routePath)
  return calculateLogScore(staticChars, PATH_MAX_POINTS, PATH_LOG_MAX)
}

function getHostScore(routeHost: string, urlHost: string | undefined): number {
  const routeDefinesHost = stringHasValue(routeHost)
  const urlHasHost = stringHasValue(urlHost)

  if (!urlHasHost && !routeDefinesHost) {
    return HOST_MAX_POINTS
  }

  if (urlHasHost && !routeDefinesHost) {
    return 0
  }

  const staticChars = countStaticChars(routeHost)
  return calculateLogScore(staticChars, HOST_MAX_POINTS, HOST_LOG_MAX)
}

function getHashScore(routeHash: string, urlHash: string): number {
  const routeDefinesHash = stringHasValue(routeHash)
  const urlHasHash = stringHasValue(urlHash) && urlHash !== '#'

  if (!urlHasHash && !routeDefinesHash) {
    return HASH_MAX_POINTS
  }

  if (urlHasHash && !routeDefinesHash) {
    return 0
  }

  const staticChars = countStaticChars(routeHash)
  return calculateLogScore(staticChars, HASH_MAX_POINTS, HASH_LOG_MAX)
}

function getQueryScore(routeQuery: string, urlSearch: URLSearchParams): number {
  const routeDefinesQuery = stringHasValue(routeQuery)
  const urlHasQuery = urlSearch.size > 0

  if (!urlHasQuery && !routeDefinesQuery) {
    return QUERY_MAX_POINTS
  }

  if (urlHasQuery && !routeDefinesQuery) {
    return 0
  }

  const staticChars = countStaticChars(routeQuery)
  return calculateLogScore(staticChars, QUERY_MAX_POINTS, QUERY_LOG_MAX)
}

function getOptionalParamPenalty(route: Route, url: string): number {
  const { path, query, hash } = parseUrl(url)

  const optionalParams = collectOptionalParams(route)
  if (optionalParams.length === 0) {
    return 0
  }

  const unfilledCount = countUnfilledOptionalParams(route, optionalParams, path, query, hash)
  const unfilledRatio = unfilledCount / optionalParams.length

  return OPTIONAL_PARAM_MAX_PENALTY * unfilledRatio
}

function collectOptionalParams(route: Route): { name: string, source: 'path' | 'query' | 'hash' | 'host' }[] {
  const params: { name: string, source: 'path' | 'query' | 'hash' | 'host' }[] = []

  for (const name of Object.keys(route.path.params)) {
    if (paramIsOptional(route.path, name)) {
      params.push({ name, source: 'path' })
    }
  }

  for (const name of Object.keys(route.query.params)) {
    if (paramIsOptional(route.query, name)) {
      params.push({ name, source: 'query' })
    }
  }

  for (const name of Object.keys(route.hash.params)) {
    if (paramIsOptional(route.hash, name)) {
      params.push({ name, source: 'hash' })
    }
  }

  for (const name of Object.keys(route.host.params)) {
    if (paramIsOptional(route.host, name)) {
      params.push({ name, source: 'host' })
    }
  }

  return params
}

function countUnfilledOptionalParams(
  route: Route,
  optionalParams: { name: string, source: 'path' | 'query' | 'hash' | 'host' }[],
  path: string,
  query: URLSearchParams,
  hash: string,
): number {
  let unfilled = 0

  for (const { name, source } of optionalParams) {
    const isFilled = isOptionalParamFilled(route, name, source, path, query, hash)
    if (!isFilled) {
      unfilled++
    }
  }

  return unfilled
}

function isOptionalParamFilled(
  route: Route,
  paramName: string,
  source: 'path' | 'query' | 'hash' | 'host',
  path: string,
  query: URLSearchParams,
  hash: string,
): boolean {
  if (source === 'query') {
    const routeQuery = new URLSearchParams(route.query.value)
    const urlQuery = new URLSearchParams(query)

    for (const [key, value] of routeQuery.entries()) {
      if (value.includes(`[?${paramName}]`)) {
        return urlQuery.has(key) && stringHasValue(urlQuery.get(key) ?? '')
      }
    }
    return false
  }

  if (source === 'path') {
    const pattern = route.path.value.replace(new RegExp(paramRegex, 'g'), '(.*)')
    const regex = new RegExp(`^${pattern}$`, 'i')
    const match = path.match(regex)
    if (!match) {
      return false
    }

    const paramMatches = Array.from(route.path.value.matchAll(new RegExp(paramRegex, 'g')))
    const paramIndex = paramMatches.findIndex((m) => m[0].includes(paramName))
    return paramIndex !== -1 && stringHasValue(match[paramIndex + 1])
  }

  if (source === 'hash') {
    const cleanHash = hash.replace(/^#/, '')
    const cleanRouteHash = route.hash.value.replace(/^#/, '')
    const pattern = cleanRouteHash.replace(new RegExp(paramRegex, 'g'), '(.*)')
    const regex = new RegExp(`^${pattern}$`, 'i')
    const match = cleanHash.match(regex)
    if (!match) {
      return false
    }

    const paramMatches = Array.from(cleanRouteHash.matchAll(new RegExp(paramRegex, 'g')))
    const paramIndex = paramMatches.findIndex((m) => m[0].includes(paramName))
    return paramIndex !== -1 && stringHasValue(match[paramIndex + 1])
  }

  return true
}

function countStaticChars(pattern: string): number {
  const withoutParams = pattern.replace(new RegExp(paramRegex, 'g'), '')
  return withoutParams.length
}

function calculateLogScore(staticChars: number, maxPoints: number, logMax: number): number {
  if (staticChars === 0) {
    return 0
  }

  const score = maxPoints * (Math.log(staticChars + 1) / Math.log(logMax))
  return Math.min(maxPoints, score)
}
