import { createUrl } from '@/services/createUrl'
import { stringHasValue } from '@/utilities/guards'

export function createIsExternal(host: string | undefined): (url: string) => boolean {
  return (url: string) => {
    const { host: targetHost } = createUrl(url)
    if (!stringHasValue(targetHost.value) || targetHost.value === host) {
      return false
    }

    return true
  }
}
