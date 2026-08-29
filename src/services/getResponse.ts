import { Rejection } from '@/types/rejection'
import { ResolvedRoute } from '@/types/resolved'
import { RedirectStatus, RenderOutcome } from '@/types/router'
import { isSameUrl } from '@/services/urlParser'
import { pathHasTrailingSlash } from '@/utilities/trailingSlashes'

export type GetResponseContext = {
  /**
   * The url the router started on.
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
  /**
   * The status to report when the url was normalized rather than redirected by the app.
   */
  redirectStatus: RedirectStatus,
}

/**
 * What a server should respond with, given where the router settled.
 */
export function getResponse({ initialUrl, route, rejection, removeTrailingSlashes, redirectStatus }: GetResponseContext): RenderOutcome {
  const type = rejection?.type ?? null

  if (removeTrailingSlashes && pathHasTrailingSlash(initialUrl)) {
    return { status: redirectStatus, location: route.href, rejection: type }
  }

  if (rejection) {
    return { status: rejection.status, rejection: type }
  }

  if (!isSameUrl(initialUrl, route.href)) {
    return { status: 302, location: route.href, rejection: type }
  }

  return { status: 200, rejection: type }
}
