import { Route } from '@/types/route'
import { stringHasValue } from '@/utilities/guards'
import { withParams } from '@/services/withParams'
import { createUrl } from '@/services/createUrl'

export function insertBaseRoute(route: Route, base?: string): Route {
  if (!stringHasValue(base)) {
    return route
  }

  const { path } = createUrl({
    path: withParams(`${base}${route.path.value}`, route.path.params),
  })

  return {
    ...route,
    path,
  }
}
