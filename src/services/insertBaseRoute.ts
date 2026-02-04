import { Route } from '@/types/route'
import { stringHasValue } from '@/utilities/guards'
import { createUrl } from '@/services/createUrl'
import { combineUrl } from '@/services/combineUrl'
import { isUrlWithSchema } from '@/types/url'

export function insertBaseRoute(route: Route, base?: string): Route {
  if (!stringHasValue(base)) {
    return route
  }

  // edge case
  if (isUrlWithSchema(route) && route.schema.path.value === '/') {
    return {
      ...route,
      ...createUrl({ path: base }),
    }
  }

  return {
    ...route,
    ...combineUrl(createUrl({ path: base }), route),
  }
}
