import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { parseUrl } from '@/services/urlParser'
import { isRejection, Rejection } from '@/types/rejection'
import { ResolvedRejection, ResolvedRoute, ResolvedRouteInternal } from '@/types/resolved'
import { isRecord } from '@/utilities/guards'
import { UrlString } from '@/types/urlString'

type RejectionLocation = {
  href: string,
  state?: unknown,
}

export function createResolvedRejection(rejection: Rejection, location: RejectionLocation, source: ResolvedRoute | null = null): ResolvedRejection & ResolvedRouteInternal {
  if (!isRejection(rejection)) {
    throw new TypeError('Expected a rejection created by createRejection')
  }

  const target = createResolvedRoute(rejection)
  const { query, hash } = parseUrl(location.href)
  const resolved: ResolvedRejection & ResolvedRouteInternal = {
    ...target,
    kind: 'rejection',
    source: source?.kind === 'rejection' ? source.source : source,
    status: rejection.status,
    href: location.href as UrlString,
    canonical: location.href as UrlString,
    query: createResolvedRouteQuery(query),
    hash,
    state: isRecord(location.state) ? location.state : {},
    getTitle: () => target.getRouteTitle(resolved),
  }

  return resolved
}
