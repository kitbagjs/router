import { InitialRouteMissingError } from '@/errors/initialRouteMissingError'
import { RouterHistoryMode } from '@/services/createRouterHistory'
import { isBrowser } from '@/utilities/isBrowser'

export function getInitialUrl(initialUrl?: string, mode?: RouterHistoryMode): string {
  if (initialUrl) {
    return initialUrl
  }

  if (isBrowser()) {
    if (mode === 'hash') {
      return window.location.hash.slice(1) || '/'
    }

    return window.location.toString()
  }

  throw new InitialRouteMissingError()
}
