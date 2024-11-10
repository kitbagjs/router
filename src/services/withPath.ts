import { isUrl, Url } from '@/types/url'

export function withPath(url: Url, path: string): Url
export function withPath(url: string, path: string): Url
export function withPath(url: string, path: string): Url {
  const cleanPath = path.replace(/^\/*/, '')

  if (isUrl(url)) {
    return `${url}${cleanPath}`
  }

  return `/${url}${cleanPath}`
}
