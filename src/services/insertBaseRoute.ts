import { Route } from '@/types/route'
import { stringHasValue } from '@/utilities/guards'
import { createUrl } from '@/services/createUrl'
import { combineUrl } from '@/services/combineUrl'

export function insertBaseRoute<T extends Route>(route: T, base?: string): T {
  if (!stringHasValue(base)) {
    return route
  }

  return {
    ...route,
    ...combineUrl(createUrl({ path: base }), route),
  }
}
