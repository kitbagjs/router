import { Route } from '@/types/route'
import { stringHasValue } from '@/utilities/guards'
import { createUrl } from '@/services/createUrl'
import { combineUrl } from '@/services/combineUrl'

export function insertBaseRoute(route: Route, base?: string): Route {
  if (!stringHasValue(base)) {
    return route
  }

  return {
    ...route,
    ...combineUrl(createUrl({ path: base }), route),
  }
}
