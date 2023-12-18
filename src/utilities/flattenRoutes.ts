import { RouteFlat, Routes, isParentRoute, isNamedRoute, Path } from '@/types'
import { mergeParams, path } from '@/utilities'

export function flattenRoutes(routes: Routes, parentPath = '', parentParams = {}): RouteFlat[] {
  return routes.reduce<RouteFlat[]>((value, route) => {
    const { params } = toPath(route.path)
    const fullPath = parentPath + route.path.toString()
    const fullParams = mergeParams(parentParams, params)

    if (isParentRoute(route)) {
      const flattened = flattenRoutes(route.children, fullPath, fullParams)

      value.push(...flattened)
    }

    if (isNamedRoute(route)) {
      value.push({
        name: route.name,
        path: fullPath,
        params: fullParams,
        regex: generateRouteRegexPattern(fullPath),
      })
    }

    return value
  }, [])
}

export function toPath(value: string | Path): Path {
  return typeof value === 'string' ? path(value, {}) : value
}

export function generateRouteRegexPattern(value: string): RegExp {
  const optionalParamRegex = /(:\?[\w]+)(?=\W|$)/g
  const requiredParamRegex = /(:[\w]+)(?=\W|$)/g

  const routeRegex = value.replace(optionalParamRegex, '(.*)').replace(requiredParamRegex, '(.+)')
  return new RegExp(`^${routeRegex}$`)
}