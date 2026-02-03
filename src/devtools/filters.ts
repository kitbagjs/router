import { Route } from '@/types/route'
import { InspectorTreePayload } from './types'
import { isUrlWithSchema } from '@/types/url'

type RouteFilterOptions = {
  route: Route,
  payload: InspectorTreePayload,
}

type RouteFilter = (options: RouteFilterOptions) => boolean

/**
 * Checks if a route has a name and should be shown
 */
const routeHasName: RouteFilter = ({ route }) => {
  return Boolean(route.name)
}

/**
 * Checks if a route matches the filter text.
 * Searches in route name, path, and meta properties.
 */
const routeMatchesFilter: RouteFilter = ({ route, payload }) => {
  if (!payload.filter) {
    return true
  }

  if (!isUrlWithSchema(route)) {
    return false
  }

  const filterLower = payload.filter.toLowerCase()

  // Check route name
  if (route.name.toLowerCase().includes(filterLower)) {
    return true
  }

  // Check route path
  if (route.schema.path.value.toLowerCase().includes(filterLower)) {
    return true
  }

  return false
}

/**
 * Checks if a route should be shown based on multiple filters.
 */
export const shouldShowRoute: RouteFilter = (options) => {
  return routeHasName(options) && routeMatchesFilter(options)
}
