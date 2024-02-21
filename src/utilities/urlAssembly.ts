import { RouterRoute } from '@/types'
import { mergeMaybeTuples } from '@/utilities/mergeMaybeTuples'
import { setParamValuesOnUrl } from '@/utilities/paramsFinder'

type AssembleUrlOptions = {
  params?: Record<string, unknown[]>,
  query?: Record<string, string>,
}

export function assembleUrl(route: RouterRoute, options: AssembleUrlOptions = {}): string {
  const { params: paramValues = {}, query: queryValues } = options
  const params = Object.entries(mergeMaybeTuples(route.pathParams, route.queryParams))
  const pathWithQuery = route.query.length ? `${route.path}?${route.query}` : route.path

  const path = params.reduce((url, [name, params]) => {
    return setParamValuesOnUrl(url, { name, params, values: paramValues[name] })
  }, pathWithQuery)

  return withQuery(path, queryValues)
}

function withQuery(url: string, query?: Record<string, string>): string {
  if (!query) {
    return url
  }

  if (Object.keys(query).length === 0) {
    return url
  }

  const queryString = new URLSearchParams(query).toString()

  if (url.includes('?')) {
    return `${url}&${queryString}`
  }

  return `${url}?${queryString}`
}