import { createRoute } from '@/services/createRoute'
import { Routes } from '@/types'
import { stringHasValue } from '@/utilities/guards'

export function insertBaseRoute(routes: Routes, base?: string): Routes {
  if (!stringHasValue(base)) {
    return routes
  }

  const baseRoute = createRoute({ path: base })

  return routes.map((route) => createRoute({
    parent: baseRoute,
    ...route,
  }))
}
