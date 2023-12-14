import { RouteFlat, Routes, isParentRoute, isNamedRoute, Param } from '@/types'
import { path, Path } from '@/utilities'

export function flattenRoutes(routes: Routes, path = ''): RouteFlat[] {
  return routes.reduce<RouteFlat[]>((value, route) => {
    const fullPath = path + route.path.toString()

    if (isParentRoute(route)) {
      const flattened = flattenRoutes(route.children, fullPath)

      value.push(...flattened)
    }

    if (isNamedRoute(route)) {
      value.push({
        name: route.name,
        path: fullPath,
        regex: generateRouteRegexPattern(fullPath),
        params: getRouteParams(route.path),
      })
    }

    return value
  }, [])
}

export function getRouteParams(value: string | Path): Record<string, Param[]> {
  const { params } = typeof value === 'string' ? path(value, {}) : value

  return params
}

export function generateRouteRegexPattern(value: string): RegExp {
  const optionalParamRegex = /(:\?[\w]+)(?=\W|$)/g
  const requiredParamRegex = /(:[\w]+)(?=\W|$)/g

  const routeRegex = value.replace(optionalParamRegex, '([^/]*)').replace(requiredParamRegex, '([^/]+)')
  return new RegExp(`^${routeRegex}$`)
}