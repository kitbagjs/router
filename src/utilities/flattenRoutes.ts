import { RouteFlat, Routes, isParentRoute, isNamedRoute } from '@/types'
import { mergeParams, path as createPath } from '@/utilities'

export function flattenRoutes(routes: Routes, parentPath = '', parentParams = {}): RouteFlat[] {
  return routes.reduce<RouteFlat[]>((value, route) => {
    const { params, path } = typeof route.path === 'string' ? createPath(route.path, {}) : route.path
    const fullPath = parentPath + path.toString()
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

export function generateRouteRegexPattern(value: string): RegExp {
  const optionalParamRegex = /(:\?[\w]+)(?=\W|$)/g
  const requiredParamRegex = /(:[\w]+)(?=\W|$)/g

  const routeRegex = value.replace(optionalParamRegex, '(.*)').replace(requiredParamRegex, '(.+)')
  return new RegExp(`^${routeRegex}$`)
}