import { QuerySource } from '@/main'
import { asUrlString, UrlString } from '@/types/urlString'

export type UrlParts = {
  host?: string,
  path: string,
  query: URLSearchParams,
  hash: string,
}

// https://en.wikipedia.org/wiki/.invalid
const FALLBACK_HOST = 'https://internal.invalid'

export function stringifyUrl(parts: Omit<UrlParts, 'query'> & { query: QuerySource }): UrlString {
  const url = new URL(parts.host ?? FALLBACK_HOST, FALLBACK_HOST)

  url.pathname = parts.path
  url.search = new URLSearchParams(parts.query).toString()
  url.hash = parts.hash

  return asUrlString(url.toString().replace(new RegExp(`^${FALLBACK_HOST}/*`), '/'))
}

export function parseUrl(value: string): UrlParts {
  const isRelative = !value.startsWith('http')

  return isRelative ? createRelativeUrl(value) : createAbsoluteUrl(value)
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
