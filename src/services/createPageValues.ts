import { DetachedStore, RouteValueResponses, RouteValueStore } from '@/services/createRouteValueStore'
import { ResolvedRoute } from '@/types/resolved'

export type PageValues = {
  prepare: () => RouteValueResponses,
  commit: () => RouteValueResponses,
  dispose: () => void,
}

/** Owns a navigation's values until they are committed or abandoned. */
export function createPageValues(route: ResolvedRoute, values: RouteValueStore): PageValues {
  let prepared: DetachedStore | undefined

  function prepare(): RouteValueResponses {
    prepared ??= values.claimStaged()

    return prepared.compute(route)
  }

  function commit(): RouteValueResponses {
    prepared?.stage()
    prepared = undefined

    return values.commit(route)
  }

  function dispose(): void {
    prepared?.dispose()
    prepared = undefined
  }

  return { prepare, commit, dispose }
}

// Rejections and external navigations retain the current route's values.
export const emptyPageValues: PageValues = {
  prepare: emptyValues,
  commit: emptyValues,
  dispose: () => {},
}

function emptyValues(): RouteValueResponses {
  return {
    props: Promise.resolve({ status: 'SUCCESS' }),
    loaders: Promise.resolve({ status: 'SUCCESS' }),
    values: [],
  }
}
