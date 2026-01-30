import { parseUrl } from '@/services/urlParser'
import { replaceParamSyntax, optionalParamRegex, getCaptureGroups } from '@/services/routeRegex'
import { Route } from '@/types/route'
import { stringHasValue } from '@/utilities/guards'
import { RouteMatchRule } from '@/types/routeMatchRule'
import { isNamedRoute } from '@/utilities/isNamedRoute'
import { routeHostMatches, routePathMatches, routeQueryMatches, routeHashMatches } from '@/services/routeMatchRules'
import { routeParamsAreValid } from '@/services/paramValidation'
import { getParamValueFromUrl } from '@/services/paramsFinder'

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

  const { host, query, hash } = parseUrl(url)

  const pathScore = getPathScore(route.path.value)
  const hostScore = getHostScore(route.host.value, host)
  const hashScore = getHashScore(route.hash.value, hash)
  const queryScore = getQueryScore(route.query.value, query)
  const optionalParamPenalty = getOptionalParamPenalty(route, url)

  return BASE_SCORE + pathScore + hostScore + hashScore + queryScore - optionalParamPenalty
}

function getPathScore(routePath: string): number {
  const staticChars = replaceParamSyntax(routePath, '').length

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

  const staticChars = replaceParamSyntax(routeHost, '').length
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

  const staticChars = replaceParamSyntax(routeHash, '').length
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

  const staticChars = replaceParamSyntax(routeQuery, '').length
  return calculateLogScore(staticChars, QUERY_MAX_POINTS, QUERY_LOG_MAX)
}

function getOptionalParamPenalty(route: Route, url: string): number {
  const { host, path, query, hash } = parseUrl(url)
  const hostMissingRatio = host ? getMissingRatioOfOptionalParams(route.host.value, host) : 0
  const pathMissingRatio = getMissingRatioOfOptionalParams(route.path.value, path)
  const queryMissingRatio = getMissingRatioOfOptionalQueryParams(route.query.value, query)
  const hashMissingRatio = getMissingRatioOfOptionalParams(route.hash.value, hash)
  const missingRatio = hostMissingRatio + pathMissingRatio + queryMissingRatio + hashMissingRatio / 4

  return OPTIONAL_PARAM_MAX_PENALTY * missingRatio
}

function getMissingRatioOfOptionalParams(value: string, url: string): number {
  const optionalParams = getCaptureGroups(value, new RegExp(optionalParamRegex, 'g'))

  if (optionalParams.length === 0) {
    return 0
  }

  const missing = optionalParams.filter((param) => {
    return !!param && !getParamValueFromUrl(url, { value, params: {} }, param)
  })

  return missing.length / optionalParams.length
}

function getMissingRatioOfOptionalQueryParams(value: string, url: URLSearchParams): number {
  const optionalParams = Array.from(new URLSearchParams(value).entries())
    .filter(([, value]) => getCaptureGroups(value, new RegExp(optionalParamRegex, 'g')).length > 0)
    .map(([key]) => key)

  if (optionalParams.length === 0) {
    return 0
  }

  const missing = optionalParams.filter((param) => !url.has(param))

  return missing.length / optionalParams.length
}

function calculateLogScore(staticChars: number, maxPoints: number, logMax: number): number {
  if (staticChars === 0) {
    return 0
  }

  const score = maxPoints * (Math.log(staticChars + 1) / Math.log(logMax))

  return Math.min(maxPoints, score)
}
