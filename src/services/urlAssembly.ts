import { setParamValue } from '@/services/params'
import { setParamValueOnUrl } from '@/services/paramsFinder'
import { getParamName, isOptionalParamSyntax } from '@/services/routeRegex'
import { QueryRecord, withQuery } from '@/services/withQuery'
import { Route } from '@/types'
import { Param } from '@/types/paramTypes'

type AssembleUrlOptions = {
  params?: Record<string, unknown>,
  query?: Record<string, string>,
}

export function assembleUrl(route: Route, options: AssembleUrlOptions = {}): string {
  const { params: paramValues = {}, query: queryValues } = options
  const params: Record<string, Param> = { ...route.path.params, ...route.query.params }
  const path = route.path.toString()
  const query = route.query.toString()

  const pathWithParamsSet = assemblePathParamValues(path, params, paramValues)
  const queryWithParamsSet = assembleQueryParamValues(query, params, paramValues)

  return withQuery(pathWithParamsSet, queryWithParamsSet, queryValues)
}

function assemblePathParamValues(path: string, params: Record<string, Param>, paramValues: Record<string, unknown>): string {
  if (!path.length) {
    return path
  }

  return Object.entries(params).reduce((url, [name, param]) => {
    return setParamValueOnUrl(url, { name, param, value: paramValues[name] })
  }, path)
}

function assembleQueryParamValues(query: string, params: Record<string, Param>, paramValues: Record<string, unknown>): QueryRecord {
  if (!query.length) {
    return {}
  }

  const search = new URLSearchParams(query)

  return Array.from(search.entries()).reduce<QueryRecord>((url, [key, value]) => {
    const paramName = getParamName(value)
    const isNotParam = !paramName

    if (isNotParam) {
      return { ...url, [key]: value }
    }

    const paramValue = setParamValue(paramValues[paramName], params[paramName])
    const valueNotProvidedAndNoDefaultUsed = paramValues[paramName] === undefined && paramValue === ''
    const shouldLeaveEmptyValueOut = isOptionalParamSyntax(value) && valueNotProvidedAndNoDefaultUsed

    if (shouldLeaveEmptyValueOut) {
      return url
    }

    return { ...url, [key]: paramValue }
  }, {})
}
