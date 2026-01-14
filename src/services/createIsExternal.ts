import { createUrl } from '@/services/createUrl'

export function createIsExternal(host: string | undefined): (url: string) => boolean {
  return (url: string) => {
    const { host: targetHost } = createUrl(url)
    if (targetHost.toString() === host) {
      return false
    }

    return true
  }
}
