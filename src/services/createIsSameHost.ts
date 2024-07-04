import { createMaybeRelativeUrl } from '@/services/createMaybeRelativeUrl'

export function createIsSameHost(host: string | undefined): (url: string) => boolean {
  return (url: string) => {
    if (host === undefined) {
      return true
    }

    const { host: targetHost } = createMaybeRelativeUrl(url)
    if (targetHost === undefined || targetHost === host) {
      return true
    }

    return false
  }
}