import { Param, Resolved } from '@/types'
import { setParamValuesOnUrl } from '@/utilities/paramsFinder'

export function assembleUrl(route: Resolved, values: Record<string, unknown[]> = {}): string {
  const params = Object.entries<Param[]>(route.params)
  const pathWithQuery = route.query.length ? `${route.path}?${route.query}` : route.path

  return params.reduce((url, [name, params]) => {
    return setParamValuesOnUrl(url, { name, params, values: values[name] })
  }, pathWithQuery)
}