import { ResolvedRoute, Routes, isParentRoute, isNamedRoute, Route, Param } from '@/types'
import { path as createPath, query as createQuery, Query, Path } from '@/utilities'
import { createResolvedRoute } from '@/utilities/createResolvedRoute'
import { mergeParams } from '@/utilities/mergeParams'

type ParentContext = {
  parentPath?: Path[],
  parentQuery?: Query[],
  parentMatches?: Route[],
  parentDepth?: number,
}

export function resolveRoutes(routes: Routes, parentContext: ParentContext = {}): ResolvedRoute[] {
  const { parentPath = [], parentQuery = [], parentMatches = [], parentDepth = 0 } = { ...parentContext }

  return routes.reduce<ResolvedRoute[]>((value, route) => {
    const path = typeof route.path === 'string' ? createPath(route.path, {}) : route.path
    const query = typeof route.query === 'string' ? createQuery(route.query, {}) : route.query ?? { query: '', params: {} }

    const fullPath: Path[] = [...parentPath, path]
    const fullQuery: Query[] = [...parentQuery, query]
    const fullMatches: Route[] = [...parentMatches, route]

    if (isParentRoute(route)) {
      const resolved = resolveRoutes(route.children, {
        parentPath: fullPath,
        parentQuery: fullQuery,
        parentMatches: fullMatches,
        parentDepth: parentDepth + 1,
      })

      value.push(...resolved)
    }

    if (isNamedRoute(route)) {
      const resolved = createResolvedRoute({
        matched: route,
        matches: fullMatches,
        name: route.name,
        path: fullPath.map(({ path }) => path.toString()).join(''),
        query: fullQuery.map(({ query }) => query.toString()).join('&'),
        pathParams: reduceParams(fullPath),
        queryParams: reduceParams(fullQuery),
        depth: parentDepth + 1,
      })

      value.push(resolved)
    }

    return value
  }, [])
}

function reduceParams(entries: Path[] | Query[]): Record<string, Param[]> {
  return entries.reduce((params, entry) => mergeParams(params, entry.params as Record<string, Param | Param[]>), {})
}