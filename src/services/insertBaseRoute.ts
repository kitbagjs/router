import { Route } from '@/types/route'
import { stringHasValue } from '@/utilities/guards'
import { withParams } from '@/services/withParams'

export function insertBaseRoute(route: Route, base?: string): Route {
  if (!stringHasValue(base)) {
    return route
  }

  const value = `${base}${route.path.value}`

  return {
    ...route,
    path: withParams(value, route.path.params),
  }
}
