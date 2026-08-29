import { Rejection } from '@/types/rejection'
import { ResolvedRoute } from '@/types/resolved'
import { RouterResponse } from '@/types/router'
import { isSameUrl } from '@/services/urlParser'
import { pathHasTrailingSlash } from '@/utilities/trailingSlashes'

export type GetResponseContext = {
  /**
   * The url the router started on. What the response describes is relative to it.
   */
  initialUrl: string,
  /**
   * The route the router settled on.
   */
  route: ResolvedRoute,
  /**
   * The rejection in effect, or null.
   */
  rejection: Rejection | null,
  /**
   * Whether the router removes trailing slashes.
   */
  removeTrailingSlashes: boolean,
}

/**
 * What a server should respond with, given where the router settled.
 *
 * Derived from the router's state rather than recorded during navigation, and deliberately without
 * calling `find`, which resolves a route and so runs its title callback as a side effect.
 */
export function getResponse({ initialUrl, route, rejection, removeTrailingSlashes }: GetResponseContext): RouterResponse {
  const type = rejection?.type ?? null

  if (removeTrailingSlashes && pathHasTrailingSlash(initialUrl)) {
    return { status: 301, location: route.href, rejection: type }
  }

  if (rejection) {
    return { status: rejection.status ?? 200, rejection: type }
  }

  if (!isSameUrl(initialUrl, route.href)) {
    return { status: 302, location: route.href, rejection: type }
  }

  return { status: 200, rejection: type }
}
