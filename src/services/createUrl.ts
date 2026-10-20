import { toUrlQueryPart, toUrlPart, UrlPart } from '@/services/withParams'
import { createParamPatterns, ParamPatterns } from '@/services/paramsFinder'
import { getParamName, generateRouteHostRegexPattern, generateRoutePathRegexPattern, generateRouteQueryRegexPatterns, generateRouteHashRegexPattern } from '@/services/routeRegex'
import { getParamValue, setParamValue } from '@/services/params'
import { parseUrl, stringifyUrl } from '@/services/urlParser'
import { IS_URL_SYMBOL, CreateUrlOptions, ToUrl, Url, ParseUrlOptions, UrlInternal } from '@/types/url'
import { UrlString } from '@/types/urlString'
import { checkDuplicateParams } from '@/utilities/checkDuplicateParams'
import { stringHasValue } from '@/utilities/guards'
import { decodeParamValue } from '@/utilities/percentEncoding'

export function createUrl<const T extends CreateUrlOptions>(options: T): ToUrl<T>
export function createUrl(urlOrOptions: CreateUrlOptions): Url {
  const options = {
    host: toUrlPart(urlOrOptions.host),
    path: toUrlPart(urlOrOptions.path),
    query: cleanQuery(toUrlQueryPart(urlOrOptions.query)),
    hash: cleanHash(toUrlPart(urlOrOptions.hash)),
  }

  checkDuplicateParams(options.path.params, options.query.params, options.host.params, options.hash.params)

  const hostPatterns = createParamPatterns(options.host)
  const pathPatterns = createParamPatterns(options.path)
  const hashPatterns = createParamPatterns(options.hash)
  const queryEntries = getQueryParamEntries(options.query)

  const host = {
    ...options.host,
    regexp: generateRouteHostRegexPattern(options.host.value),
    stringify(params: Record<string, unknown> = {}): string {
      return assembleParamValues(options.host, hostPatterns, params)
    },
  }

  const path = {
    ...options.path,
    regexp: {
      trailingSlashIgnored: generateRoutePathRegexPattern(options.path.value),
      trailingSlashRemoved: generateRoutePathRegexPattern(options.path.value.replace(/^(.+)\/$/, '$1')),
    },
    stringify(params: Record<string, unknown> = {}): string {
      return assembleParamValues(options.path, pathPatterns, params)
    },
  }

  const query = {
    ...options.query,
    regexp: generateRouteQueryRegexPatterns(options.query.value),
    stringify(params: Record<string, unknown> = {}): string {
      return assembleQueryParamValues(options.query, queryEntries, params).toString()
    },
  }

  const hash = {
    ...options.hash,
    regexp: generateRouteHashRegexPattern(options.hash.value),
    stringify(params: Record<string, unknown> = {}): string {
      return assembleParamValues(options.hash, hashPatterns, params)
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

  function checkMatchesRegex(url: string, options: ParseUrlOptions = {}): void {
    const parts = parseUrl(url)
    const shouldRemoveTrailingSlashes = options.removeTrailingSlashes ?? true

    if (!host.regexp.test(parts.host ?? '')) {
      throw new Error('Host does not match')
    }

    const pathRegex = shouldRemoveTrailingSlashes ? path.regexp.trailingSlashRemoved : path.regexp.trailingSlashIgnored
    if (!pathRegex.test(parts.path)) {
      throw new Error('Path does not match')
    }

    const queryString = parts.query.toString()
    if (!query.regexp.every((pattern) => pattern.test(queryString))) {
      throw new Error('Query does not match')
    }

    if (!hash.regexp.test(parts.hash)) {
      throw new Error('Hash does not match')
    }
  }

  function parse(url: string, options: ParseUrlOptions = {}): Record<string, unknown> {
    checkMatchesRegex(url, options)

    const parts = parseUrl(url)

    return {
      ...getParams(host, hostPatterns, parts.host ?? ''),
      ...getParams(path, pathPatterns, parts.path),
      ...getQueryParams(query, queryEntries, parts.query.toString()),
      ...getParams(hash, hashPatterns, parts.hash),
    }
  }

  function tryParse(url: string, options: ParseUrlOptions = {}): { success: true, params: Record<string, unknown> } | { success: false, params: {}, error: Error } {
    try {
      return { success: true, params: parse(url, options) }
    } catch (cause) {
      return { success: false, params: {}, error: new Error('Failed to parse url', { cause }) }
    }
  }

  const internal = {
    [IS_URL_SYMBOL]: true,
    schema: { host, path, query, hash },
    params: {},
  } as const satisfies UrlInternal

  const url = {
    ...internal,
    isRelative: !stringHasValue(options.host.value),
    stringify,
    parse,
    tryParse,
  } satisfies Url & UrlInternal

  return url
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

function assembleParamValues(part: UrlPart, patterns: ParamPatterns, paramValues: Record<string, unknown>): string {
  return Object.keys(part.params).reduce((url, name) => {
    return patterns.setValue(url, name, paramValues[name])
  }, part.value)
}

/**
 * A query param as the route declares it: the search key, the value as written, and the param it holds.
 */
type QueryParamEntry = {
  key: string,
  value: string,
  paramName: string,
}

/**
 * The query's params, read out of its value once rather than on every parse and stringify.
 */
function getQueryParamEntries(query: UrlPart): QueryParamEntry[] {
  return Array.from(new URLSearchParams(query.value).entries()).flatMap(([key, value]) => {
    const paramName = getParamName(value)

    return paramName ? [{ key, value, paramName }] : []
  })
}

function assembleQueryParamValues(query: UrlPart, entries: QueryParamEntry[], paramValues: Record<string, unknown>): URLSearchParams {
  const search = new URLSearchParams(query.value)

  for (const { key, value, paramName } of entries) {
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

function getParams(part: UrlPart, patterns: ParamPatterns, url: string): Record<string, unknown> {
  const values: Record<string, unknown> = {}

  for (const [name, urlParam] of Object.entries(part.params)) {
    const stringValue = patterns.getValue(url, name)
    const paramValue = getParamValue(decodeParamValue(stringValue), urlParam)

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
function getQueryParams(query: UrlPart, entries: QueryParamEntry[], url: string): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  const actualSearch = new URLSearchParams(url)

  for (const { key, paramName } of entries) {
    const valueOnUrl = actualSearch.get(key) ?? undefined
    const paramValue = getParamValue(valueOnUrl, query.params[paramName])
    values[paramName] = paramValue
  }

  return values
}
