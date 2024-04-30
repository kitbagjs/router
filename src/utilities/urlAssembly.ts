import { Param, Route } from '@/types'
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

  const pathWithParamsSet = assembleParamValues(path, params, paramValues)
  const queryWithParamsSet = assembleParamValues(query, params, paramValues)

  return withQuery(pathWithParamsSet, queryWithParamsSet, queryValues)
}

function assembleParamValues(part: string, params: [string, Param][], paramValues: Record<string, unknown>): string {
  if (!part.length) {
    return part
  }

  return params.reduce<string>((url, [name, param]) => {
    return setParamValueOnUrl(url, { name, param, value: paramValues[name] })
  }, part)
}