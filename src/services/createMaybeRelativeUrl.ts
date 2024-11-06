export type MaybeRelativeUrl = {
  protocol?: string,
  host?: string,
  pathname: string,
  searchParams: URLSearchParams,
  search: string,
  hash: string,
}

export function createMaybeRelativeUrl(value: string): MaybeRelativeUrl {
  const isRelative = !value.startsWith('http')

  return isRelative ? createRelativeUrl(value) : createAbsoluteUrl(value)
}

function createAbsoluteUrl(value: string): MaybeRelativeUrl {
  const { protocol, host, pathname, search, searchParams, hash } = new URL(value, value)

  return {
    protocol, host, pathname, search, searchParams, hash,
  }
}

function createRelativeUrl(value: string): MaybeRelativeUrl {
  const { pathname, search, searchParams, hash } = new URL(value, 'https://localhost')

  return {
    pathname, search, searchParams, hash,
  }
}
