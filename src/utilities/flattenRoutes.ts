import { RouteFlat, Routes, isParentRoute, isNamedRoute } from '@/types'

export function flattenRoutes(routes: Routes, path = ''): RouteFlat[] {
  return routes.reduce<RouteFlat[]>((value, route) => {
    const fullPath = path + route.path

    if (isParentRoute(route)) {
      const flattened = flattenRoutes(route.children, fullPath)

      value.push(...flattened)
    }

    if (isNamedRoute(route)) {
      value.push({
        name: route.name,
        regex: generateRouteRegexPattern(fullPath),
        path: fullPath,
      })
    }

    return value
  }, [])
}

export function generateRouteRegexPattern(path: string): RegExp {
  const optionalParamRegex = /(:\?[\w]+)(?=\W|$)/g
  const requiredParamRegex = /(:[\w]+)(?=\W|$)/g

  const routeRegex = path.replace(optionalParamRegex, '([^/]*)').replace(requiredParamRegex, '([^/]+)')
  return new RegExp(`^${routeRegex}$`)
}