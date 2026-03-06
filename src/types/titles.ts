import { ResolvedRoute, ResolvedRouteUnion } from './resolved'
import { Route } from './route'
import { MaybePromise } from './utilities'

export type SetTitleContext = {
  from: ResolvedRoute,
  getParentTitle: () => Promise<string | undefined>,
}

export type SetTitleCallback<TRoute extends Route = Route> = (to: ResolvedRouteUnion<TRoute>, context: SetTitleContext) => MaybePromise<string>
export type GetTitle<TRoute extends Route = Route> = (to: ResolvedRouteUnion<TRoute>) => MaybePromise<string | undefined>
export type SetTitle<TRoute extends Route = Route> = (callback: SetTitleCallback<TRoute>) => void

export type RouteTitle<TRoute extends Route = Route> = {
  /**
   * Adds a callback to set the title for the route.
   */
  setTitle: SetTitle<TRoute>,
  /**
   * Gets the title for the route.
   * @internal
   */
  getTitle: GetTitle<TRoute>,
}

export type RouteWithTitle<TRoute extends Route = Route> = TRoute & RouteTitle<TRoute>

export function isRouteWithTitle(route: Route): route is RouteWithTitle {
  return 'setTitle' in route && 'getTitle' in route
}

export function createRouteTitle(parent: Route | undefined): RouteTitle {
  let setTitleCallback: SetTitleCallback | undefined

  const setTitle: SetTitle = (callback) => {
    setTitleCallback = callback
  }

  const getTitle: GetTitle = (to) => {
    const getParentTitle = async (): Promise<string | undefined> => {
      if (parent && isRouteWithTitle(parent)) {
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
