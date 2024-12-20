import { asUrl, Url, UrlParts } from '@/types/url'

export function createUrl({ protocol, host, pathname, search, searchParams, hash }: Partial<UrlParts>): Url {
  const url = new URL('https://localhost')

  if (protocol) {
    url.protocol = protocol
  }

  if (host) {
    url.host = host
  }

  if (pathname) {
    url.pathname = pathname
  }

  if (searchParams) {
    url.search = new URLSearchParams(searchParams).toString()
  } else if (search) {
    url.search = search
  }

  if (hash) {
    url.hash = hash
  }

  const value = url.toString().replace(/^https:\/\/localhost\/*/, '/')

  return asUrl(value)
}
