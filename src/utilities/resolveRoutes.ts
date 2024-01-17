import { markRaw } from 'vue'
import { Resolved, Routes, isParentRoute, isNamedRoute, Route, Param } from '@/types'
import { mergeParams, path as createPath, query as createQuery, Query, Path } from '@/utilities'

type ParentContext = {
  parentPath?: Path[],
  parentQuery?: Query[],
  parentMatches?: Route[],
}

export function resolveRoutes(routes: Routes, parentContext: ParentContext = {}): Resolved<Route>[] {
  const { parentPath = [], parentQuery = [], parentMatches = [] } = { ...parentContext }

  return routes.reduce<Resolved<Route>[]>((value, route) => {
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
      })

      value.push(...resolved)
    }

    if (isNamedRoute(route)) {
      value.push({
        matched: markRaw(route),
        matches: markRaw(fullMatches),
        name: route.name,
        path: fullPath.map(({ path }) => path.toString()).join(''),
        query: fullQuery.map(({ query }) => query.toString()).join('&'),
        params: mergeParams(reduceParams(fullPath), reduceParams(fullQuery)),
      })
    }

    return value
  }, [])
}

function reduceParams(entries: { params: Record<PropertyKey, unknown> }[]): Record<PropertyKey, Param[]> {
  return entries.reduce((params, entry) => mergeParams(params, entry.params as Record<string, Param | Param[]>), {})
}