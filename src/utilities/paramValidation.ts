import { ResolvedRoute, RouteMatchRule } from '@/types'
import { getParamValue, getParamValuesFromUrl } from '@/utilities'

export const routeParamsAreValid: RouteMatchRule = (route, url) => {
  try {
    getRouteParams(route, url)
  } catch {
    return false
  }

  return true
}

export const getRouteParams = (route: ResolvedRoute, url: string): Record<string, unknown> => {
  const params: Record<string, unknown> = {}

  for (const [key, paramsTuple] of Object.entries(route.params)) {
    const stringValues = getParamValuesFromUrl(url, route.path, key)
    const values = paramsTuple.map((param, index) => getParamValue(stringValues[index], param))

    params[key] = values
  }

  return params
}