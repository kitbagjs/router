import { parseUrl } from '@/services/urlParser'
import { getParamValue } from '@/services/params'
import { getParamValueFromUrl } from '@/services/paramsFinder'
import { Route } from '@/types/route'
import { RouteMatchRule } from '@/types/routeMatchRule'
import { WithParams } from '@/services/withParams'
import { getParamName, isOptionalParamSyntax } from '@/services/routeRegex'

export const routeParamsAreValid: RouteMatchRule = (route, url) => {
  try {
    getRouteParamValues(route, url)
  } catch {
    return false
  }

  return true
}

export const getRouteParamValues = (route: Route, url: string): Record<string, unknown> => {
  const { protocol, host, pathname, search, hash } = parseUrl(url)

  return {
    ...getParams(route.host, `${protocol}//${host}`),
    ...getParams(route.path, pathname),
    ...getQueryParams(route.query, search),
    ...getParams(route.hash, hash),
  }
}

function getParams(path: WithParams, url: string): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  const decodedValueFromUrl = decodeURIComponent(url)

  for (const [key, param] of Object.entries(path.params)) {
    const isOptional = key.startsWith('?')
    const paramName = isOptional ? key.slice(1) : key
    const stringValue = getParamValueFromUrl(decodedValueFromUrl, path.value, key)
    const paramValue = getParamValue(stringValue, param, isOptional)

    values[paramName] = paramValue
  }

  return values
}

/**
 * This function has unique responsibilities not accounted for by getParams thanks to URLSearchParams
 *
 * 1. Find query values when other query params are omitted or in a different order
 * 2. Find query values based on the url search key, which might not match the param name
 */
function getQueryParams(query: WithParams, url: string): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  const routeSearch = new URLSearchParams(query.value)
  const actualSearch = new URLSearchParams(url)

  for (const [key, value] of Array.from(routeSearch.entries())) {
    const paramName = getParamName(value)
    const isNotParam = !paramName
    if (isNotParam) {
      continue
    }
    const isOptional = isOptionalParamSyntax(value)
    const paramKey = isOptional ? `?${paramName}` : paramName
    const valueOnUrl = actualSearch.get(key) ?? undefined
    const paramValue = getParamValue(valueOnUrl, query.params[paramKey], isOptional)
    values[paramName] = paramValue
  }
  return values
}
