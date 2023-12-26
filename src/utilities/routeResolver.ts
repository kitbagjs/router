import { Resolved, Routes, isParentRoute, isNamedRoute, Route, Param } from '@/types'
import { mergeParams, path as createPath } from '@/utilities'

type RouteParentContext = {
  parentPath: string,
  parentParams: Record<string, Param[]>,
  parentNames: string[],
}

export function resolveRoutes(routes: Routes, parents?: RouteParentContext): Resolved<Route>[] {
  const { parentPath = [], parentParams = {}, parentNames = [] } = { ...parents }
  return routes.reduce<Resolved<Route>[]>((value, route) => {
    const { params, path } = typeof route.path === 'string' ? createPath(route.path, {}) : route.path
    const fullPath = parentPath + path.toString()
    const fullParams = mergeParams(parentParams, params)
    const fullNames = [...parentNames, ...isNamedRoute(route) ? [route.name] : []]

    if (isParentRoute(route)) {
      const flattened = resolveRoutes(route.children, {
        parentPath: fullPath,
        parentParams: fullParams,
        parentNames: fullNames,
      })

      value.push(...flattened)
    }

    if (isNamedRoute(route)) {
      value.push({
        matched: route,
        name: route.name,
        path: fullPath,
        params: fullParams,
        regex: generateRouteRegexPattern(fullPath),
        parentNames,
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