import { toWithParams, WithParams } from '@/services/withParams'
import { getParamValueFromUrl, setParamValueOnUrl } from '@/services/paramsFinder'
import { getParamName, isOptionalParamSyntax, paramIsOptional, replaceParamSyntaxWithCatchAllsAndEscapeRest, escapeRegExp } from '@/services/routeRegex'
import { getParamValue, setParamValue } from '@/services/params'
import { CreateUrlOptions, ToUrl, Url } from '@/types/url'
import { asUrlString, UrlString } from '@/types/urlString'
import { checkDuplicateParams } from '@/utilities/checkDuplicateParams'

// https://en.wikipedia.org/wiki/.invalid
const FALLBACK_HOST = 'https://internal.invalid'

export function createUrl<const T extends CreateUrlOptions>(options: T): ToUrl<T>
export function createUrl(url: string): Url
export function createUrl(url: string | CreateUrlOptions): Url
export function createUrl(urlOrOptions: CreateUrlOptions | string): Url {
  if (typeof urlOrOptions === 'string') {
    const url = new URL(urlOrOptions, FALLBACK_HOST)
    const includesHost = urlOrOptions.startsWith('http')
    const host = includesHost ? `${url.protocol}//${url.host}` : undefined

    return createUrl({ host, path: url.pathname, query: url.search, hash: url.hash })
  }

  const options = {
    host: toWithParams(urlOrOptions.host),
    path: toWithParams(urlOrOptions.path),
    query: toWithParams(urlOrOptions.query),
    hash: toWithParams(urlOrOptions.hash),
  }

  checkDuplicateParams(options.path.params, options.query.params, options.host.params, options.hash.params)

  const host = {
    ...options.host,
    regexp: replaceParamSyntaxWithCatchAllsAndEscapeRest(options.host.value),
    toString(params: Record<string, unknown> = {}): string {
      return assembleParamValues(options.host, params)
    },
  }

  const path = {
    ...options.path,
    regexp: replaceParamSyntaxWithCatchAllsAndEscapeRest(options.path.value),
    toString(params: Record<string, unknown> = {}): string {
      return assembleParamValues(options.path, params)
    },
  }

  const query = {
    ...options.query,
    regexp: generateQueryRegexPatterns(options.query.value),
    toString(params: Record<string, unknown> = {}): string {
      return assembleQueryParamValues(options.query, params).toString()
    },
  }

  const hash = {
    ...options.hash,
    regexp: replaceParamSyntaxWithCatchAllsAndEscapeRest(options.hash.value),
    toString(params: Record<string, unknown> = {}): string {
      return assembleParamValues(options.hash, params)
    },
  }

  function toString(params: Record<string, unknown> = {}): UrlString {
    const url = assembleUrl({
      host: host.toString(params),
      path: path.toString(params),
      query: query.toString(params),
      hash: hash.toString(params),
    })

    return asUrlString(url.toString().replace(new RegExp(`^${FALLBACK_HOST}/*`), '/'))
  }

  function assembleUrl({ host, path, query, hash }: { host: string, path: string, query: string, hash: string }): URL {
    const url = new URL(host, FALLBACK_HOST)

    url.pathname = path
    url.search = query
    url.hash = hash

    return url
  }

  function toUrl(params: Record<string, unknown> = {}): URL {
    return new URL(toString(params), FALLBACK_HOST)
  }

  function parse(url: string): Record<string, unknown> {
    const parts = new URL(url, FALLBACK_HOST)

    return {
      ...getParams(host, `${parts.protocol}//${parts.host}`),
      ...getParams(path, parts.pathname),
      ...getQueryParams(query, parts.search),
      ...getParams(hash, parts.hash),
    }
  }

  function match(_url: string): number {
    return 0
  }

  const internal = {
    _schema: { host, path, query, hash },
    _params: {},
  }

  return { ...internal, toUrl, toString, parse, match }
}

function assembleParamValues(part: WithParams, paramValues: Record<string, unknown>): string {
  return Object.keys(part.params).reduce((url, name) => {
    return setParamValueOnUrl(url, part, name, paramValues[name])
  }, part.value)
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

function getParams(path: WithParams, url: string): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  const decodedValueFromUrl = decodeURIComponent(url)

  for (const [name, param] of Object.entries(path.params)) {
    const stringValue = getParamValueFromUrl(decodedValueFromUrl, path, name)
    const isOptional = paramIsOptional(path, name)
    const paramValue = getParamValue(stringValue, param, isOptional)

    values[name] = paramValue
  }

  return values
}

/**
 * This function has unique responsibilities not accounted for by getParams thanks to URLSearchParams
 *
 * 1. Find query values when other query params are omitted or in a different order
 * 2. Find query values based on the url search key, which might not match the param name
 */
function getQueryParams(query: WithParams, url: string): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  const routeSearch = new URLSearchParams(query.value)
  const actualSearch = new URLSearchParams(url)

  for (const [key, value] of Array.from(routeSearch.entries())) {
    const paramName = getParamName(value)
    const isNotParam = !paramName
    if (isNotParam) {
      continue
    }
    const isOptional = isOptionalParamSyntax(value)
    const valueOnUrl = actualSearch.get(key) ?? undefined
    const paramValue = getParamValue(valueOnUrl, query.params[paramName], isOptional)
    values[paramName] = paramValue
  }
  return values
}

function generateQueryRegexPatterns(value: string): RegExp[] {
  const queryParams = new URLSearchParams(value)

  return Array
    .from(queryParams.entries())
    .filter(([, value]) => !isOptionalParamSyntax(value))
    .map(([key, value]) => {
      const valueRegex = replaceParamSyntaxWithCatchAllsAndEscapeRest(value)

      return new RegExp(`${escapeRegExp(key)}=${valueRegex}(&|$)`, 'i')
    })
}
