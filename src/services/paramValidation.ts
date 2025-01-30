import { parseUrl } from '@/services/urlParser'
import { getParamValue } from '@/services/params'
import { getParamValueFromUrl } from '@/services/paramsFinder'
import { Route } from '@/types/route'
import { RouteMatchRule } from '@/types/routeMatchRule'
import { WithParams } from '@/services/withParams'

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
    ...getParams(route.query, search),
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
