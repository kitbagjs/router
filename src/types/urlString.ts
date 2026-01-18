import { QuerySource } from './querySource'

export type UrlString = `http://${string}` | `https://${string}` | `/${string}`

export type UrlParts = {
  protocol?: string,
  host?: string,
  pathname: string,
  searchParams: QuerySource,
  search: string,
  hash: string,
}

/**
 * A type guard for determining if a value is a valid URL.
 * @param value - The value to check.
 * @returns `true` if the value is a valid URL, otherwise `false`.
 * @group Type Guards
 */
export function isUrlString(value: unknown): value is UrlString {
  if (typeof value !== 'string') {
    return false
  }

  const regexPattern = /^(https?:\/\/|\/).*/g

  return regexPattern.test(value)
}

/**
 * Converts a string to a valid URL.
 * @param value - The string to convert.
 * @returns The valid URL.
 */
export function asUrlString(value: string): UrlString {
  if (isUrlString(value)) {
    return value
  }

  return `/${value}`
}
