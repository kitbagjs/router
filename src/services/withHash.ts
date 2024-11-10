import { Hash } from '@/types/hash'
import { Url } from '@/types/url'

export function withHash(url: Url, hash: Hash): Url
export function withHash(url: string, hash: Hash): string
export function withHash(url: string, hash: Hash): string {
  if (hash.value) {
    return `${url}#${hash.value}`
  }

  return url
}
