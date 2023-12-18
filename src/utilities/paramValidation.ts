import { Param, RouteFlat } from '@/types'
import { getParamValue, findParamValues } from '@/utilities'

export function routeParamsAreValid(value: string, route: RouteFlat): boolean {
  const entries = Object.entries<Param[]>(route.params)

  if (entries.length === 0) {
    return true
  }

  for (const [key, paramsTuple] of entries) {
    const stringValues = findParamValues(value, route.path, key)

    try {
      const parsed = stringValues.map((stringValue, index) => getParamValue(stringValue, paramsTuple[index]))

      console.log(parsed)
    } catch {
      return false
    }
  }

  return true
}