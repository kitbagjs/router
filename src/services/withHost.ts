import { isUrl, Url } from '@/types/url'
import { stringHasValue } from '@/utilities'

export function withHost(url: Url, host?: string): Url
export function withHost(url: string, host?: string): string
export function withHost(url: string, host?: string): string {
  if (!stringHasValue(host)) {
    return url
  }

  const cleanPath = url.replace(/^\/*/, '')
  const cleanHost = host.replace(/\/*$/, '')

  if (isUrl(cleanHost)) {
    return `${cleanHost}/${cleanPath}`
  }

  return `https://${cleanHost}/${cleanPath}`
}
