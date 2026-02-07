import { QuerySource } from '@/types/querySource'
import { asUrlString, UrlString } from '@/types/urlString'
import { stringHasValue } from '@/utilities/guards'
import { combineUrlSearchParams } from '@/utilities/urlSearchParams'

type UrlParts = {
  host?: string,
  path: string,
  query: URLSearchParams,
  hash: string,
}

type UrlPartsInput = {
  host?: string,
  path?: string,
  query?: QuerySource,
  hash?: string,
}

// https://en.wikipedia.org/wiki/.invalid
const FALLBACK_HOST = 'https://internal.invalid'

export function stringifyUrl(parts: UrlPartsInput): UrlString {
  const url = new URL(parts.host ?? FALLBACK_HOST, FALLBACK_HOST)

  url.pathname = parts.path ?? ''
  url.search = new URLSearchParams(parts.query).toString()
  url.hash = parts.hash ?? ''

  return asUrlString(url.toString().replace(new RegExp(`^${FALLBACK_HOST}/*`), '/'))
}

export function parseUrl(value: string): UrlParts {
  const isRelative = !value.startsWith('http')

  return isRelative ? createRelativeUrl(value) : createAbsoluteUrl(value)
}

export function updateUrl(url: string, updates: UrlPartsInput): UrlString
export function updateUrl(url: Partial<UrlParts>, updates: UrlPartsInput): UrlParts
export function updateUrl(url: string | Partial<UrlParts>, updates: UrlPartsInput): string | UrlParts {
  if (typeof url === 'string') {
    const updated = updateUrl(parseUrl(url), updates)

    return stringifyUrl(updated)
  }

  const updatedQuery = new URLSearchParams(updates.query)

  return {
    host: stringHasValue(updates.host) ? updates.host : url.host,
    path: stringHasValue(updates.path) ? updates.path : url.path ?? '',
    query: combineUrlSearchParams(updatedQuery, url.query),
    hash: stringHasValue(updates.hash) ? updates.hash : url.hash ?? '',
  }
}

function createAbsoluteUrl(value: string): UrlParts {
  const { protocol, host, pathname, searchParams, hash } = new URL(value, value)

  return {
    host: `${protocol}//${host}`, path: pathname, query: searchParams, hash,
  }
}

function createRelativeUrl(value: string): UrlParts {
  const { pathname, searchParams, hash } = new URL(value, FALLBACK_HOST)

  return {
    path: pathname, query: searchParams, hash,
  }
}
