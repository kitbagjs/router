export type Url = `http://${string}` | `https://${string}` | `/${string}`

export type UrlParts = {
  protocol?: string,
  host?: string,
  pathname: string,
  searchParams: URLSearchParams,
  search: string,
  hash: string,
}

export function isUrl(value: unknown): value is Url {
  if (typeof value !== 'string') {
    return false
  }

  const regexPattern = /^(https?:\/\/|\/).*/g

  return regexPattern.test(value)
}

export function asUrl(value: string): Url {
  if (isUrl(value)) {
    return value
  }

  return `/${value}`
}
