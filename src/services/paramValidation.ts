import { parseUrl } from '@/services/urlParser'
import { getParamValue } from '@/services/params'
import { getParamValueFromUrl } from '@/services/paramsFinder'
import { Route } from '@/types/route'
import { RouteMatchRule } from '@/types/routeMatchRule'
import { WithParams } from '@/services/withParams'
import { getParamName, isOptionalParamSyntax, paramIsOptional } from '@/services/routeRegex'

export const routeParamsAreValid: RouteMatchRule = (route, url) => {
  try {
    getRouteParamValues(route, url)
  } catch {
    return false
  }

  return true
}

export const getRouteParamValues = (route: Route, url: string): Record<string, unknown> => {
  const { host, path, query, hash } = parseUrl(url)

  return {
    ...host ? getParams(route.host, host) : {},
    ...getParams(route.path, path),
    ...getQueryParams(route.query, query),
    ...getParams(route.hash, hash),
  }
}

function getParams(path: WithParams, url: string): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  const decodedValueFromUrl = decodeURIComponent(url)

  for (const [name, param] of Object.entries(path.params)) {
    const stringValue = getParamValueFromUrl(decodedValueFromUrl, path, name)
    const isOptional = paramIsOptional(path, name)
    const paramValue = getParamValue(stringValue, param, isOptional)

    values[name] = paramValue
  }

  return values
}

/**
 * This function has unique responsibilities not accounted for by getParams thanks to URLSearchParams
 *
 * 1. Find query values when other query params are omitted or in a different order
 * 2. Find query values based on the url search key, which might not match the param name
 */
function getQueryParams(query: WithParams, actualSearch: URLSearchParams): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  const routeSearch = new URLSearchParams(query.value)

  for (const [key, value] of Array.from(routeSearch.entries())) {
    const paramName = getParamName(value)
    const isNotParam = !paramName
    if (isNotParam) {
      continue
    }
    const isOptional = isOptionalParamSyntax(value)
    const valueOnUrl = actualSearch.get(key) ?? undefined
    const paramValue = getParamValue(valueOnUrl, query.params[paramName], isOptional)
    values[paramName] = paramValue
  }
  return values
}
