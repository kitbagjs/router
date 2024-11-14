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
import { Url } from '@/types/url'
import { withHost } from '@/services/withHost'
import { withHash } from '@/services/withHash'
import { withPath } from '@/services/withPath'

type AssembleUrlOptions = {
  params?: Record<string, unknown>,
  query?: Record<string, string>,
  hash?: string,
}

export function assembleUrl(route: Route, options: AssembleUrlOptions = {}): Url {
  const { params: paramValues = {}, query: queryValues } = options

  const pathWithParamsSet = assemblePathParamValues(route.path, paramValues)
  const queryWithParamsSet = assembleQueryParamValues(route.query, paramValues)
  const hostWithParamsSet = assembleHostParamValues(route.host, paramValues)
  const hash = createHash(route.hash.value ?? options.hash)

  type UrlAssemblyFunction = (url: Url) => Url

  const assembly: UrlAssemblyFunction[] = [
    (url) => withPath(url, pathWithParamsSet),
    (url) => withQuery(url, queryWithParamsSet, queryValues),
    (url) => withHost(url, hostWithParamsSet),
    (url) => withHash(url, hash.value),
  ]

  return assembly.reduce<Url>((url, join) => join(url), '/')
}

function assembleHostParamValues(host: Host, paramValues: Record<string, unknown>): string {
  return Object.entries(host.params).reduce((url, [name, param]) => {
    const paramName = getParamName(`${paramStart}${name}${paramEnd}`)

    if (!paramName) {
      return url
    }

    return setParamValueOnUrl(url, { name, param, value: paramValues[paramName] })
  }, host.value)
}

function assemblePathParamValues(path: Path, paramValues: Record<string, unknown>): string {
  return Object.entries(path.params).reduce((url, [name, param]) => {
    const paramName = getParamName(`${paramStart}${name}${paramEnd}`)

    if (!paramName) {
      return url
    }

    return setParamValueOnUrl(url, { name, param, value: paramValues[paramName] })
  }, path.value)
}

function assembleQueryParamValues(query: Query, paramValues: Record<string, unknown>): QueryRecord {
  if (!query.value) {
    return {}
  }

  const search = new URLSearchParams(query.value)

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
