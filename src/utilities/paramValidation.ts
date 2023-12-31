import { Param, Resolved, Route } from '@/types'
import { getParamValue, getParamValuesFromUrl } from '@/utilities'

export function routeParamsAreValid(url: string, route: Resolved<Route>): boolean {
  const params = Object.entries<Param[]>(route.params)

  for (const [key, paramsTuple] of params) {
    const stringValues = getParamValuesFromUrl(url, route.path, key)

    try {
      paramsTuple.forEach((param, index) => getParamValue(stringValues[index], param))
    } catch {
      return false
    }
  }

  return true
}