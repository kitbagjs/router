import { Param, ResolvedRoute, RouteMatchRule } from '@/types'
import { createMaybeRelativeUrl, getParamValue, getParamValuesFromUrl, mergeMaybeTuples, unwrapTuples } from '@/utilities'

export const routeParamsAreValid: RouteMatchRule = (route, url) => {
  try {
    getRouteParamValues(route, url)
  } catch {
    return false
  }

  return true
}

export const getRouteParamValues = (route: ResolvedRoute, url: string): Record<string, unknown> => {
  const { pathname, search } = createMaybeRelativeUrl(url)

  const params = mergeMaybeTuples(
    getRouteParams(route.pathParams, route.path, pathname),
    getRouteParams(route.queryParams, route.query, search),
  )

  return unwrapTuples(params)
}

const getRouteParams = (paramDefinitions: Record<string, Param[]>, paramFormat: string, valueFromUrl: string): Record<string, unknown[]> => {
  const params: Record<string, unknown[]> = {}

  for (const [key, paramsTuple] of Object.entries(paramDefinitions)) {
    const stringValues = getParamValuesFromUrl(valueFromUrl, paramFormat, key)
    const values = paramsTuple.map((param, index) => getParamValue(stringValues[index], param))

    params[key] = values
  }

  return params
}