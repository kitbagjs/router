import { parseUrl } from '@/services/urlParser'
import { getParamValue } from '@/services/params'
import { getParamValueFromUrl } from '@/services/paramsFinder'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { Route } from '@/types/route'
import { RouteMatchRule } from '@/types/routeMatchRule'

export const routeParamsAreValid: RouteMatchRule = (route, url) => {
  try {
    getRouteParamValues(route, url)
  } catch {
    return false
  }

  return true
}

export const getRouteParamValues = (route: Route, url: string): Record<string, unknown> => {
  const { pathname, search } = parseUrl(url)

  return {
    ...getPathParams(route.path, pathname),
    ...getQueryParams(route.query, search),
  }
}

function getPathParams(path: Path, url: string): Record<string, unknown> {
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

function getQueryParams(query: Query, url: string): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  const actualSearch = new URLSearchParams(url)

  for (const [key, param] of Object.entries(query.params)) {
    const isOptional = key.startsWith('?')
    const paramName = isOptional ? key.slice(1) : key
    const valueOnUrl = actualSearch.get(paramName) ?? undefined
    const paramValue = getParamValue(valueOnUrl, param, isOptional)

    values[paramName] = paramValue
  }

  return values
}
