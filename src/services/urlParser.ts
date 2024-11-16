import { UrlParts } from '@/types/url'

export function parseUrl(value: string): UrlParts {
  const isRelative = !value.startsWith('http')

  return isRelative ? createRelativeUrl(value) : createAbsoluteUrl(value)
}

function createAbsoluteUrl(value: string): UrlParts {
  const { protocol, host, pathname, search, searchParams, hash } = new URL(value, value)

  return {
    protocol, host, pathname, search, searchParams, hash,
  }
}

function createRelativeUrl(value: string): UrlParts {
  const { pathname, search, searchParams, hash } = new URL(value, 'https://localhost')

  return {
    pathname, search, searchParams, hash,
  }
}
