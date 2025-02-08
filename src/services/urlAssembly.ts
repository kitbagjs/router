import { setParamValue } from '@/services/params'
import { setParamValueOnUrl } from '@/services/paramsFinder'
import { getParamName, isOptionalParamSyntax } from '@/services/routeRegex'
import { Route } from '@/types/route'
import { Url } from '@/types/url'
import { createUrl } from '@/services/urlCreator'
import { parseUrl } from '@/services/urlParser'
import { combineUrlSearchParams } from '@/utilities/urlSearchParams'
import { QuerySource } from '@/types/querySource'
import { WithParams } from '@/services/withParams'

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
  const hash = route.hash.value ? assemblePathParamValues(route.hash, paramValues) : options.hash

  const hostWithParamsSet = assembleHostParamValues(route.host, paramValues)
  const { protocol, host } = parseUrl(hostWithParamsSet)

  return createUrl({ protocol, host, pathname, searchParams, hash })
}

function assembleHostParamValues(host: WithParams, paramValues: Record<string, unknown>): string {
  const hostWithProtocol = !!host.value && !host.value.startsWith('http') ? `https://${host.value}` : host.value

  return Object.keys(host.params).reduce((url, name) => {
    return setParamValueOnUrl(url, host, name, paramValues[name])
  }, hostWithProtocol)
}

function assemblePathParamValues(path: WithParams, paramValues: Record<string, unknown>): string {
  return Object.keys(path.params).reduce((url, name) => {
    return setParamValueOnUrl(url, path, name, paramValues[name])
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
    const paramValue = setParamValue(paramValues[paramName], query.params[paramName], isOptional)
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
