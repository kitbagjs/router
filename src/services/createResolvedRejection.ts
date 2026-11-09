import { createResolvedRoute } from '@/services/createResolvedRoute'
import { isRejection, Rejection } from '@/types/rejection'
import { IS_RESOLVED_REJECTION_SYMBOL, isResolvedRoute, ResolvedRejection, ResolvedRoute, ResolvedRouteInternal } from '@/types/resolved'

export function createResolvedRejection(route: ResolvedRoute, rejection: Rejection): ResolvedRejection & ResolvedRouteInternal {
  if (!isResolvedRoute(route) || !isRejection(rejection)) {
    throw new TypeError('Expected a resolved route and a rejection created by createRejection')
  }

  const target = createResolvedRoute(rejection.route)
  const getTargetTitle = target.getRouteTitle
  const getOriginalTitle = route.getRouteTitle

  async function getTitle(): Promise<string | undefined> {
    const title = await getTargetTitle(resolved)

    if (title !== undefined) {
      return title
    }

    return getOriginalTitle(resolved)
  }

  const resolved: ResolvedRejection & ResolvedRouteInternal = {
    ...route,
    [IS_RESOLVED_REJECTION_SYMBOL]: true,
    rejection,
    views: target.views,
    get hooks() {
      return target.hooks
    },
    getTitle,
  }

  return resolved
}
