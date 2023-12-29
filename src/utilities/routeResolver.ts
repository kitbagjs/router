import { Resolved, Routes, isParentRoute, isNamedRoute, Route, Param } from '@/types'
import { mergeParams, path as createPath } from '@/utilities'

type ParentContext = {
  parentPath?: string,
  parentParams?: Record<string, Param[]>,
  parentMatches?: Route[],
}

export function resolveRoutes(routes: Routes, parentContext: ParentContext = {}): Resolved<Route>[] {
  const { parentPath = [], parentParams = {}, parentMatches = [] } = { ...parentContext }

  return routes.reduce<Resolved<Route>[]>((value, route) => {
    const { params, path } = typeof route.path === 'string' ? createPath(route.path, {}) : route.path
    const fullPath = parentPath + path.toString()
    const fullParams = mergeParams(parentParams, params)
    const fullMatches = [...parentMatches, route]

    if (isParentRoute(route)) {
      const flattened = resolveRoutes(route.children, {
        parentPath: fullPath,
        parentParams: fullParams,
        parentMatches: fullMatches,
      })

      value.push(...flattened)
    }

    if (isNamedRoute(route)) {
      value.push({
        matched: route,
        matches: fullMatches,
        name: route.name,
        path: fullPath,
        params: fullParams,
      })
    }

    return value
  }, [])
}