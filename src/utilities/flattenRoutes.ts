import { RouteFlat, Routes, isParentRoute, isNamedRoute } from '@/types'
import { Path, combineParams, path } from '@/utilities'

export function flattenRoutes(routes: Routes, parentPath = '', parentParams = {}): RouteFlat[] {
  return routes.reduce<RouteFlat[]>((value, route) => {
    const { params }: Path = typeof route.path === 'string' ? path(route.path, {}) : route.path
    const fullPath = parentPath + route.path.toString()
    const fullParams = combineParams(parentParams, params)

    if (isParentRoute(route)) {
      const flattened = flattenRoutes(route.children, fullPath, fullParams)

      value.push(...flattened)
    }

    if (isNamedRoute(route)) {
      value.push({
        name: route.name,
        params: fullParams,
        path: fullPath,
        regex: generateRouteRegexPattern(fullPath),
      })
    }

    return value
  }, [])
}

export function generateRouteRegexPattern(value: string): RegExp {
  const optionalParamRegex = /(:\?[\w]+)(?=\W|$)/g
  const requiredParamRegex = /(:[\w]+)(?=\W|$)/g

  const routeRegex = value.replace(optionalParamRegex, '([^/]*)').replace(requiredParamRegex, '([^/]+)')
  return new RegExp(`^${routeRegex}$`)
}