import { toWithParams, ToWithParams, WithParams } from '@/services/withParams'
import { getParamValueFromUrl, setParamValueOnUrl } from '@/services/paramsFinder'
import { getParamName, isOptionalParamSyntax, paramIsOptional } from '@/services/routeRegex'
import { getParamValue, setParamValue } from '@/services/params'
import { combineUrlSearchParams } from '@/utilities/urlSearchParams'
import { stringHasValue } from '@/utilities/guards'
import { Url, ToStringOptions } from '@/types/url'
import { asUrlString, UrlString } from '@/types/urlString'

export type CreateUrlOptions = {
  host?: string | WithParams | undefined,
  path?: string | WithParams | undefined,
  query?: string | WithParams | undefined,
  hash?: string | WithParams | undefined,
}

type ToUrl<T extends CreateUrlOptions> = Url<
  ToWithParams<T['host']>,
  ToWithParams<T['path']>,
  ToWithParams<T['query']>,
  ToWithParams<T['hash']>
>

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

  const host: Url['host'] = {
    schema: options.host,
    toString(params = {}) {
      return assembleParamValues(options.host, params)
    },
  }

  const path: Url['path'] = {
    schema: options.path,
    toString(params = {}) {
      return assembleParamValues(options.path, params)
    },
  }

  const query: Url['query'] = {
    schema: options.query,
    toString(params = {}) {
      return assembleQueryParamValues(options.query, params).toString()
    },
  }

  const hash: Url['hash'] = {
    schema: options.hash,
    toString(params = {}) {
      return assembleParamValues(options.hash, params)
    },
  }

  function toString(params: Record<string, unknown> = {}, options: ToStringOptions = {}): UrlString {
    const url = new URL(host.toString(params), FALLBACK_HOST)
    const combinedQuery = combineUrlSearchParams(query.toString(params), options.query)
    const hashWithFallback = stringHasValue(hash.schema.value) ? hash.toString(params) : options.hash

    url.pathname = path.toString(params)
    url.search = combinedQuery.toString()
    url.hash = hashWithFallback ?? ''

    return asUrlString(url.toString().replace(new RegExp(`^${FALLBACK_HOST}/*`), '/'))
  }

  function parse(url: string): Record<string, unknown> {
    const parts = new URL(url, FALLBACK_HOST)

    return {
      ...getParams(host.schema, `${parts.protocol}//${parts.host}`),
      ...getParams(path.schema, parts.pathname),
      ...getQueryParams(query.schema, parts.search),
      ...getParams(hash.schema, parts.hash),
    }
  }

  return { host, path, query, hash, toString, parse }
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

// const hasParams = createComputedUrl({
//   host: 'https://kitbag.dev',
//   pathname: '/[id]',
//   query: 'color=red',
//   hash: '#[page]',
// })

// // can call toString on the whole url, any params will be required
// hasParams.toString({ id: '14', page: '123' })
// //  https://kitbag.dev/14?color=red#123

// // can also call toString on individual parts
// hasParams.host.toString()
// //  https://kitbag.dev

// // if "part" requires params, it'll be requires by toString
// hasParams.path.toString({ id: '14' })
// //  /14

// // retain access to the WithParams object
// const hostParams = hasParams.host.schema.params
// //     ^?
