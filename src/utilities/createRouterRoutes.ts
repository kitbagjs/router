import { DuplicateParamsError } from '@/errors'
import { RouterRoute, Routes, isParentRoute, isNamedRoute, Route, Param } from '@/types'
import { path as createPath, query as createQuery, Query, Path } from '@/utilities'
import { createRouterRoute } from '@/utilities/createRouterRoute'

type ParentContext = {
  parentPath?: Path[],
  parentQuery?: Query[],
  parentMatches?: Route[],
  parentDepth?: number,
}

export function createRouterRoutes<T extends Routes>(routes: T, parentContext: ParentContext = {}): RouterRoute[] {
  const { parentPath = [], parentQuery = [], parentMatches = [], parentDepth = 0 } = { ...parentContext }

  return routes.reduce<RouterRoute[]>((value, route) => {
    const path = typeof route.path === 'string' ? createPath(route.path, {}) : route.path
    const query = typeof route.query === 'string' ? createQuery(route.query, {}) : route.query ?? { query: '', params: {} }

    const { hasDuplicates, key } = checkDuplicateKeys(path, query)
    if (hasDuplicates) {
      throw new DuplicateParamsError(key)
    }

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
        pathParams: extractParams(fullPath),
        queryParams: extractParams(fullQuery),
        depth: parentDepth + 1,
      })

      value.push(routerRoute)
    }

    return value
  }, [])
}

function checkDuplicateKeys(path: Path, query: Query): { key: string, hasDuplicates: true } | { key: undefined, hasDuplicates: false } {
  const pathKeys = Object.keys(path.params)
  const queryKeys = Object.keys(query.params)
  const duplicateKey = pathKeys.find(key => queryKeys.includes(key))

  if (duplicateKey) {
    return {
      key: duplicateKey,
      hasDuplicates: true,
    }
  }

  return {
    key: undefined,
    hasDuplicates: false,
  }
}

function extractParams(entries: Path[] | Query[]): Record<string, Param> {
  return entries.reduce((params, entry) => {
    return {
      ...params,
      ...entry.params,
    }
  }, {})
}