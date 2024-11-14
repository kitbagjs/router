import { Url } from '@/types/url'
import { createMaybeRelativeUrl, maybeRelativeUrlToString } from '@/services/maybeRelativeUrl'

export function withHash(url: Url, hash?: string): Url
export function withHash(url: string, hash?: string): Url
export function withHash(url: string, hash?: string): Url {
  const { hash: previousHash, ...parts } = createMaybeRelativeUrl(url)
  const cleanHash = hash ? `#${hash}` : ''

  return maybeRelativeUrlToString({ hash: cleanHash, ...parts })
}
