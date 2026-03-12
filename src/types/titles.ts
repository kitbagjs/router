import { ResolvedRoute, ResolvedRouteUnion } from './resolved'
import { Route } from './route'
import { MaybePromise } from './utilities'

export type SetTitleContext = {
  from: ResolvedRoute,
  getParentTitle: () => Promise<string | undefined>,
}

export type SetTitleCallback<TRoute extends Route = Route> = (to: ResolvedRouteUnion<TRoute>, context: SetTitleContext) => MaybePromise<string>
export type GetTitle<TRoute extends Route = Route> = (to: ResolvedRouteUnion<TRoute>) => Promise<string | undefined>
export type SetTitle<TRoute extends Route = Route> = (callback: SetTitleCallback<TRoute>) => void

export type RouteSetTitle<TRoute extends Route = Route> = {
  /**
   * Adds a callback to set the document title for the route.
   */
  setTitle: SetTitle<TRoute>,
}

export type RouteGetTitle<TRoute extends Route = Route> = {
  /**
   * @internal
   * Gets the title for the route.
   */
  getTitle: GetTitle<TRoute>,
}

export function isRouteWithTitleSetter<T extends Route | ResolvedRoute>(route: T): route is T & RouteSetTitle {
  return 'setTitle' in route
}

export function isRouteWithTitleGetter<T extends Route | ResolvedRoute>(route: T): route is T & RouteGetTitle {
  return 'getTitle' in route
}

export function createRouteTitle(parent: Route | undefined): RouteGetTitle & RouteSetTitle {
  let setTitleCallback: SetTitleCallback | undefined

  const setTitle: SetTitle = (callback) => {
    setTitleCallback = callback
  }

  const getTitle: GetTitle = async (to) => {
    const getParentTitle = async (): Promise<string | undefined> => {
      if (parent && isRouteWithTitleGetter(parent)) {
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
