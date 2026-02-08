import { toUrlPart, UrlPart } from '@/services/withParams'
import { getParamValueFromUrl, setParamValueOnUrl } from '@/services/paramsFinder'
import { getParamName, generateRouteHostRegexPattern, generateRoutePathRegexPattern, generateRouteQueryRegexPatterns, generateRouteHashRegexPattern } from '@/services/routeRegex'
import { getParamValue, setParamValue } from '@/services/params'
import { parseUrl, stringifyUrl } from '@/services/urlParser'
import { IS_URL_SYMBOL, CreateUrlOptions, ToUrl, Url } from '@/types/url'
import { UrlString } from '@/types/urlString'
import { checkDuplicateParams } from '@/utilities/checkDuplicateParams'
import { stringHasValue } from '@/utilities/guards'

export function createUrl<const T extends CreateUrlOptions>(options: T): ToUrl<T>
export function createUrl(urlOrOptions: CreateUrlOptions): Url {
  const options = {
    host: toUrlPart(urlOrOptions.host),
    path: toUrlPart(urlOrOptions.path),
    query: cleanQuery(toUrlPart(urlOrOptions.query)),
    hash: cleanHash(toUrlPart(urlOrOptions.hash)),
  }

  checkDuplicateParams(options.path.params, options.query.params, options.host.params, options.hash.params)

  const host = {
    ...options.host,
    regexp: generateRouteHostRegexPattern(options.host.value),
    stringify(params: Record<string, unknown> = {}): string {
      return assembleParamValues(options.host, params)
    },
  }

  const path = {
    ...options.path,
    regexp: generateRoutePathRegexPattern(options.path.value),
    stringify(params: Record<string, unknown> = {}): string {
      return assembleParamValues(options.path, params)
    },
  }

  const query = {
    ...options.query,
    regexp: generateRouteQueryRegexPatterns(options.query.value),
    stringify(params: Record<string, unknown> = {}): string {
      return assembleQueryParamValues(options.query, params).toString()
    },
  }

  const hash = {
    ...options.hash,
    regexp: generateRouteHashRegexPattern(options.hash.value),
    stringify(params: Record<string, unknown> = {}): string {
      return assembleParamValues(options.hash, params)
    },
  }

  function stringify(params: Record<string, unknown> = {}): UrlString {
    return stringifyUrl({
      host: host.stringify(params),
      path: path.stringify(params),
      query: query.stringify(params),
      hash: hash.stringify(params),
    })
  }

  function parse(url: string): Record<string, unknown> {
    const parts = parseUrl(url)

    return {
      ...getParams(host, parts.host ?? ''),
      ...getParams(path, parts.path),
      ...getQueryParams(query, parts.query.toString()),
      ...getParams(hash, parts.hash),
    }
  }

  function tryParse(url: string): { success: true, params: Record<string, unknown> } | { success: false, params: {}, error: Error } {
    const parts = parseUrl(url)

    if (!host.regexp.test(parts.host ?? '')) {
      return { success: false, params: {}, error: new Error('Host does not match') }
    }

    if (!path.regexp.test(parts.path)) {
      return { success: false, params: {}, error: new Error('Path does not match') }
    }

    const queryString = parts.query.toString()
    if (!query.regexp.every((pattern) => pattern.test(queryString))) {
      return { success: false, params: {}, error: new Error('Query does not match') }
    }

    if (!hash.regexp.test(parts.hash)) {
      return { success: false, params: {}, error: new Error('Hash does not match') }
    }

    try {
      return { success: true, params: parse(url) }
    } catch (cause) {
      return { success: false, params: {}, error: new Error('Failed to parse url', { cause }) }
    }
  }

  const internal = {
    schema: { host, path, query, hash },
    params: {},
    [IS_URL_SYMBOL]: true,
  } as const

  return {
    ...internal,
    isRelative: !stringHasValue(options.host.value),
    stringify,
    parse,
    tryParse,
  }
}

function cleanHash(hash: UrlPart): UrlPart {
  return {
    ...hash,
    value: hash.value.replace(/^#/, ''),
  }
}

function cleanQuery(query: UrlPart): UrlPart {
  return {
    ...query,
    value: query.value.replace(/^\?/, ''),
  }
}

function assembleParamValues(part: UrlPart, paramValues: Record<string, unknown>): string {
  return Object.keys(part.params).reduce((url, name) => {
    return setParamValueOnUrl(url, part, name, paramValues[name])
  }, part.value)
}

function assembleQueryParamValues(query: UrlPart, paramValues: Record<string, unknown>): URLSearchParams {
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

    const paramValue = setParamValue(paramValues[paramName], query.params[paramName])
    const valueNotProvidedAndNoDefaultUsed = paramValues[paramName] === undefined && paramValue === ''
    const shouldLeaveEmptyValueOut = query.params[paramName].isOptional && valueNotProvidedAndNoDefaultUsed

    if (shouldLeaveEmptyValueOut) {
      search.delete(key, value)
    } else {
      search.set(key, paramValue)
    }
  }

  return search
}

function getParams(path: UrlPart, url: string): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  const decodedValueFromUrl = decodeURIComponent(url)

  for (const [name, urlParam] of Object.entries(path.params)) {
    const stringValue = getParamValueFromUrl(decodedValueFromUrl, path, name)
    const paramValue = getParamValue(stringValue, urlParam)

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
function getQueryParams(query: UrlPart, url: string): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  const routeSearch = new URLSearchParams(query.value)
  const actualSearch = new URLSearchParams(url)

  for (const [key, value] of Array.from(routeSearch.entries())) {
    const paramName = getParamName(value)
    const isNotParam = !paramName

    if (isNotParam) {
      continue
    }

    const valueOnUrl = actualSearch.get(key) ?? undefined
    const paramValue = getParamValue(valueOnUrl, query.params[paramName])
    values[paramName] = paramValue
  }
  return values
}
