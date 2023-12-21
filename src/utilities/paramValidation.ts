import { Param, RouteFlat } from '@/types'
import { getParamValue, findParamValues } from '@/utilities'

export function routeParamsAreValid(url: string, route: RouteFlat): boolean {
  const params = Object.entries<Param[]>(route.params)

  for (const [key, paramsTuple] of params) {
    const stringValues = findParamValues(url, route.path, key)

    try {
      paramsTuple.forEach((param, index) => getParamValue(stringValues[index], param))
    } catch {
      return false
    }
  }

  return true
}