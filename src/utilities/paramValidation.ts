import { Param, RouterRoute, RouteMatchRule } from '@/types'
import { createMaybeRelativeUrl } from '@/utilities/createMaybeRelativeUrl'
import { getParamValue } from '@/utilities/params'
import { getParamValueFromUrl } from '@/utilities/paramsFinder'

export const routeParamsAreValid: RouteMatchRule = (route, url) => {
  try {
    getRouteParamValues(route, url)
  } catch {
    return false
  }

  return true
}

export const getRouteParamValues = (route: RouterRoute, url: string): Record<string, unknown> => {
  const { pathname, search } = createMaybeRelativeUrl(url)

  return {
    ...getRouteParams(route.pathParams, route.path, pathname),
    ...getRouteParams(route.queryParams, route.query, search),
  }
}

const getRouteParams = (paramDefinitions: Record<string, Param>, paramFormat: string, valueFromUrl: string): Record<string, unknown[]> => {
  const params: Record<string, unknown[]> = {}

  for (const [key, param] of Object.entries(paramDefinitions)) {
    const stringValue = getParamValueFromUrl(valueFromUrl, paramFormat, key)
    const formattedValues = getParamValue(stringValue, param)

    params[key] = formattedValues
  }

  return params
}