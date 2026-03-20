import { ResolvedRoute, ResolvedRouteUnion } from '@/types/resolved'
import { isRoute, Route } from './route'
import { MaybePromise } from './utilities'

export type SetRouteTitleContext = {
  from: ResolvedRoute,
  getParentTitle: () => Promise<string | undefined>,
}

export type SetRouteTitleCallback<TRoute extends Route = Route> = (to: ResolvedRouteUnion<TRoute>, context: SetRouteTitleContext) => MaybePromise<string>
export type GetRouteTitle<TRoute extends Route = Route> = (to: ResolvedRouteUnion<TRoute>) => Promise<string | undefined>
export type SetRouteTitle<TRoute extends Route = Route> = (callback: SetRouteTitleCallback<TRoute>) => void

export type RouteSetTitle<TRoute extends Route = Route> = {
  /**
   * Adds a callback to set the document title for the route.
   */
  setTitle: SetRouteTitle<TRoute>,
}

type CreateRouteTitle = {
  setTitle: SetRouteTitle,
  getTitle: GetRouteTitle,
}

export function createRouteTitle(parent: Route | undefined): CreateRouteTitle {
  let setTitleCallback: SetRouteTitleCallback | undefined

  const setTitle: SetRouteTitle = (callback) => {
    setTitleCallback = callback
  }

  const getTitle: GetRouteTitle = async (to) => {
    const getParentTitle = async (): Promise<string | undefined> => {
      if (parent && isRoute(parent)) {
        return parent.getTitle(to)
      }

      return undefined
    }

    if (!setTitleCallback) {
      return getParentTitle()
    }

    return setTitleCallback(to, {
      from: to,
      getParentTitle,
    })
  }

  return {
    setTitle,
    getTitle,
  }
}
