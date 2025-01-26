import { hash as createHash } from '@/services/hash'
import { setParamValue } from '@/services/params'
import { setParamValueOnUrl } from '@/services/paramsFinder'
import { getParamName, isOptionalParamSyntax } from '@/services/routeRegex'
import { paramEnd, paramStart } from '@/types/params'
import { Route } from '@/types/route'
import { Url } from '@/types/url'
import { createUrl } from '@/services/urlCreator'
import { parseUrl } from '@/services/urlParser'
import { combineUrlSearchParams } from '@/utilities/urlSearchParams'
import { QuerySource } from '@/types/querySource'
import { WithParams } from './withParams'

type AssembleUrlOptions = {
  params?: Record<string, unknown>,
  query?: QuerySource,
  hash?: string,
}

export function assembleUrl(route: Route, options: AssembleUrlOptions = {}): Url {
  const { params: paramValues = {}, query: queryValues } = options
  const routeQuery = assembleQueryParamValues(route.query, paramValues)
  const searchParams = combineUrlSearchParams(routeQuery, queryValues)
  const pathname = assemblePathParamValues(route.path, paramValues)
  const hash = createHash(route.hash.value ?? options.hash).value

  const hostWithParamsSet = assembleHostParamValues(route.host, paramValues)
  const { protocol, host } = parseUrl(hostWithParamsSet)

  return createUrl({ protocol, host, pathname, searchParams, hash })
}

function assembleHostParamValues(host: WithParams, paramValues: Record<string, unknown>): string {
  const hostWithProtocol = !!host.value && !host.value.startsWith('http') ? `https://${host.value}` : host.value

  return Object.entries(host.params).reduce((url, [name, param]) => {
    const paramName = getParamName(`${paramStart}${name}${paramEnd}`)

    if (!paramName) {
      return url
    }

    return setParamValueOnUrl(url, { name, param, value: paramValues[paramName] })
  }, hostWithProtocol)
}

function assemblePathParamValues(path: WithParams, paramValues: Record<string, unknown>): string {
  return Object.entries(path.params).reduce((url, [name, param]) => {
    const paramName = getParamName(`${paramStart}${name}${paramEnd}`)

    if (!paramName) {
      return url
    }

    return setParamValueOnUrl(url, { name, param, value: paramValues[paramName] })
  }, path.value)
}

function assembleQueryParamValues(query: WithParams, paramValues: Record<string, unknown>): URLSearchParams {
  const search = new URLSearchParams(query.value)

  if (!query.value) {
    return search
  }

  for (const [key, value] of Array.from(search.entries())) {
    const paramName = getParamName(value)
    const isNotParam = !paramName

    if (isNotParam) {
      continue
    }

    const isOptional = isOptionalParamSyntax(value)
    const paramKey = isOptional ? `?${paramName}` : paramName
    const paramValue = setParamValue(paramValues[paramName], query.params[paramKey], isOptional)
    const valueNotProvidedAndNoDefaultUsed = paramValues[paramName] === undefined && paramValue === ''
    const shouldLeaveEmptyValueOut = isOptional && valueNotProvidedAndNoDefaultUsed

    if (shouldLeaveEmptyValueOut) {
      search.delete(key, value)
    } else {
      search.set(key, paramValue)
    }
  }

  return search
}
