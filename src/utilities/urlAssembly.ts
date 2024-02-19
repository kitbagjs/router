import { Param, ResolvedRoute } from '@/types'
import { mergeParams } from '@/utilities/mergeParams'
import { setParamValuesOnUrl } from '@/utilities/paramsFinder'

export function assembleUrl(route: ResolvedRoute, values: Record<string, unknown[]> = {}): string {
  const params = Object.entries<Param[]>(mergeParams(route.pathParams, route.queryParams))
  const pathWithQuery = route.query.length ? `${route.path}?${route.query}` : route.path

  return params.reduce((url, [name, params]) => {
    return setParamValuesOnUrl(url, { name, params, values: values[name] })
  }, pathWithQuery)
}