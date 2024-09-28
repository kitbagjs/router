import { hash as createHash } from '@/services/hash'
import { setParamValue } from '@/services/params'
import { setParamValueOnUrl } from '@/services/paramsFinder'
import { getParamName, isOptionalParamSyntax } from '@/services/routeRegex'
import { QueryRecord, withQuery } from '@/services/withQuery'
import { Host } from '@/types/host'
import { paramEnd, paramStart } from '@/types/params'
import { Path } from '@/types/path'
import { Query } from '@/types/query'
import { Route } from '@/types/route'

type AssembleUrlOptions = {
  params?: Record<string, unknown>,
  query?: Record<string, string>,
  hash?: string,
}

export function assembleUrl(route: Route, options: AssembleUrlOptions = {}): string {
  const { params: paramValues = {}, query: queryValues } = options

  const hostWithParamsSet = assembleHostParamValues(route.host, paramValues)
  const pathWithParamsSet = assemblePathParamValues(route.path, paramValues)
  const queryWithParamsSet = assembleQueryParamValues(route.query, paramValues)

  const url = withQuery(`${hostWithParamsSet}${pathWithParamsSet}`, queryWithParamsSet, queryValues)
  const hash = createHash(options.hash ?? route.hash.value).toString()

  return `${url}${hash}`
}

function assembleHostParamValues(host: Host, paramValues: Record<string, unknown>): string {
  const value = host.toString()

  return Object.entries(host.params).reduce((url, [name, param]) => {
    const paramName = getParamName(`${paramStart}${name}${paramEnd}`)

    if (!paramName) {
      return url
    }

    return setParamValueOnUrl(url, { name, param, value: paramValues[paramName] })
  }, value)
}

function assemblePathParamValues(path: Path, paramValues: Record<string, unknown>): string {
  const value = path.toString()

  return Object.entries(path.params).reduce((url, [name, param]) => {
    const paramName = getParamName(`${paramStart}${name}${paramEnd}`)

    if (!paramName) {
      return url
    }

    return setParamValueOnUrl(url, { name, param, value: paramValues[paramName] })
  }, value)
}

function assembleQueryParamValues(query: Query, paramValues: Record<string, unknown>): QueryRecord {
  const value = query.toString()

  if (!value) {
    return {}
  }

  const search = new URLSearchParams(value)

  return Array.from(search.entries()).reduce<QueryRecord>((url, [key, value]) => {
    const paramName = getParamName(value)
    const isNotParam = !paramName

    if (isNotParam) {
      return { ...url, [key]: value }
    }

    const paramValue = setParamValue(paramValues[paramName], query.params[paramName], isOptionalParamSyntax(value))
    const valueNotProvidedAndNoDefaultUsed = paramValues[paramName] === undefined && paramValue === ''
    const shouldLeaveEmptyValueOut = isOptionalParamSyntax(value) && valueNotProvidedAndNoDefaultUsed

    if (shouldLeaveEmptyValueOut) {
      return url
    }

    return { ...url, [key]: paramValue }
  }, {})
}
