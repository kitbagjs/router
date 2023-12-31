import { Param, Resolved, Route } from '@/types'
import { setParamValuesOnUrl } from '@/utilities/paramsFinder'

export function assembleUrl(route: Resolved<Route>, values: Record<string, unknown[]>): string {
  const params = Object.entries<Param[]>(route.params)

  return params.reduce((url, [name, params]) => {
    return setParamValuesOnUrl(url, { name, params, values: values[name] })
  }, route.path)
}