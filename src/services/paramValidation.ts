import { createMaybeRelativeUrl } from '@/services/createMaybeRelativeUrl'
import { getParamValue } from '@/services/params'
import { getParamValueFromUrl } from '@/services/paramsFinder'
import { Route } from '@/types'
import { Param } from '@/types/paramTypes'
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
  const { pathname, search } = createMaybeRelativeUrl(url)

  return {
    ...getRouteParams(route.pathParams, route.path.toString(), pathname),
    ...getRouteParams(route.queryParams, route.query.toString(), search),
  }
}

const getRouteParams = (paramDefinitions: Record<string, Param>, paramFormat: string, valueFromUrl: string): Record<string, unknown[]> => {
  const params: Record<string, unknown[]> = {}
  const decodedValueFromUrl = decodeURIComponent(valueFromUrl)

  for (const [key, param] of Object.entries(paramDefinitions)) {
    const stringValue = getParamValueFromUrl(decodedValueFromUrl, paramFormat, key)
    const formattedValues = getParamValue(stringValue, param)

    params[key] = formattedValues
  }

  return params
}