import { createMaybeRelativeUrl } from '@/services/maybeRelativeUrl'

export function createIsExternal(host: string | undefined): (url: string) => boolean {
  return (url: string) => {
    const { host: targetHost } = createMaybeRelativeUrl(url)
    if (targetHost === undefined || targetHost === host) {
      return false
    }

    return true
  }
}
