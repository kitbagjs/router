import { Routes } from '@/types'
import { stringHasValue } from '@/utilities/guards'
import { withParams } from '@/services/withParams'

export function insertBaseRoute(routes: Routes, base?: string): Routes {
  if (!stringHasValue(base)) {
    return routes
  }

  return routes.map((route) => {
    const value = `${base}${route.path.value}`

    return {
      ...route,
      path: withParams(value, route.path.params),
    }
  })
}
