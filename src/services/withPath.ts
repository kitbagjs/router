import { Url } from '@/types/url'
import { createMaybeRelativeUrl, maybeRelativeUrlToString } from '@/services/maybeRelativeUrl'

export function withPath(url: Url, path?: string): Url
export function withPath(url: string, path?: string): Url
export function withPath(url: string, path?: string): Url {
  const { pathname, ...parts } = createMaybeRelativeUrl(url)
  const cleanPath = path?.replace(/^\/*/, '/') ?? ''

  return maybeRelativeUrlToString({ pathname: cleanPath, ...parts })
}
