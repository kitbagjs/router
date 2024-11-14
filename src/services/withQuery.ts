import { asUrl, Url } from '@/types/url'

export type QueryRecord = Record<string, string>

export function withQuery(url: Url, ...queries: (string | URLSearchParams | QueryRecord | undefined)[]): Url
export function withQuery(url: string, ...queries: (string | URLSearchParams | QueryRecord | undefined)[]): Url
export function withQuery(url: string, ...queries: (string | URLSearchParams | QueryRecord | undefined)[]): Url {
  return queries.reduce<Url>((value, query) => {
    if (!query) {
      return value
    }

    const queryString = new URLSearchParams(query).toString()

    if (Object.keys(queryString).length === 0) {
      return value
    }

    if (value.includes('?')) {
      return `${value}&${queryString}`
    }

    return `${value}?${queryString}`
  }, asUrl(url))
}
