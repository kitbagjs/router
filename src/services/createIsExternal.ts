import { parseUrl } from '@/services/urlParser'

export function createIsExternal(host: string | undefined): (url: string) => boolean {
  return (url: string) => {
    const { host: targetHost } = parseUrl(url)
    if (targetHost === undefined || targetHost === host) {
      return false
    }

    return true
  }
}
