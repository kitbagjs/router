import { Route } from '@/types'
import { setParamValueOnUrl } from '@/utilities/paramsFinder'
import { withQuery } from '@/utilities/withQuery'

type AssembleUrlOptions = {
  params?: Record<string, unknown>,
  query?: Record<string, string>,
}

export function assembleUrl(route: Route, options: AssembleUrlOptions = {}): string {
  const { params: paramValues = {}, query: queryValues } = options
  const params = Object.entries({ ...route.pathParams, ...route.queryParams })
  const path = route.path.toString()
  const query = route.query.toString()
  const pathWithQuery = query.length ? `${path}?${query}` : path

  const url = params.reduce<string>((url, [name, param]) => {
    return setParamValueOnUrl(url, { name, param, value: paramValues[name] })
  }, pathWithQuery)

  return withQuery(url, queryValues)
}