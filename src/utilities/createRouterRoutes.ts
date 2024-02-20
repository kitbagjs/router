import { RouterRoute, Routes, isParentRoute, isNamedRoute, Route, Param } from '@/types'
import { path as createPath, query as createQuery, Query, Path } from '@/utilities'
import { createRouterRoute } from '@/utilities/createRouterRoute'
import { mergeMaybeTuples } from '@/utilities/mergeMaybeTuples'

type ParentContext = {
  parentPath?: Path[],
  parentQuery?: Query[],
  parentMatches?: Route[],
  parentDepth?: number,
}

export function createRouterRoutes(routes: Routes, parentContext: ParentContext = {}): RouterRoute[] {
  const { parentPath = [], parentQuery = [], parentMatches = [], parentDepth = 0 } = { ...parentContext }

  return routes.reduce<RouterRoute[]>((value, route) => {
    const path = typeof route.path === 'string' ? createPath(route.path, {}) : route.path
    const query = typeof route.query === 'string' ? createQuery(route.query, {}) : route.query ?? { query: '', params: {} }

    const fullPath: Path[] = [...parentPath, path]
    const fullQuery: Query[] = [...parentQuery, query]
    const fullMatches: Route[] = [...parentMatches, route]

    if (isParentRoute(route)) {
      const routerRoute = createRouterRoutes(route.children, {
        parentPath: fullPath,
        parentQuery: fullQuery,
        parentMatches: fullMatches,
        parentDepth: parentDepth + 1,
      })

      value.push(...routerRoute)
    }

    if (isNamedRoute(route)) {
      const routerRoute = createRouterRoute({
        matched: route,
        matches: fullMatches,
        name: route.name,
        path: fullPath.map(({ path }) => path.toString()).join(''),
        query: fullQuery.map(({ query }) => query.toString()).join('&'),
        pathParams: reduceParams(fullPath),
        queryParams: reduceParams(fullQuery),
        depth: parentDepth + 1,
      })

      value.push(routerRoute)
    }

    return value
  }, [])
}

function reduceParams(entries: Path[] | Query[]): Record<string, Param[]> {
  return entries.reduce((params, entry) => mergeMaybeTuples(params, entry.params as Record<string, Param | Param[]>), {})
}