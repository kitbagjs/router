import { InitialRouteMissingError } from '@/errors/initialRouteMissingError'
import { createMaybeRelativeUrl } from '@/services/createMaybeRelativeUrl'
import { isBrowser } from '@/utilities/isBrowser'

export function getInitialUrl(initialUrl?: string): string {
  if (initialUrl) {
    return initialUrl
  }

  if (isBrowser()) {
    const { pathname, search, hash } = createMaybeRelativeUrl(window.location.toString())

    return [pathname, search, hash].join('')
  }

  throw new InitialRouteMissingError()
}