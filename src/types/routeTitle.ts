import { CallbackRoutes, ContextRoutes } from '@/types/routeContext'
import { ResolvedRouteUnion } from '@/types/resolved'
import { isRoute, Route, CreatedRouteOptions } from './route'
import { RouteWithMethods } from '@/types/routeWithMethods'
import { Url } from '@/types/url'
import { MaybePromise } from './utilities'

export type GetTitleCallback = () => Promise<string | undefined>

export type SetRouteTitleContext<TRoute extends Route = Route> = {
  from: ResolvedRouteUnion<CallbackRoutes<ContextRoutes<TRoute['context']>, TRoute>[number]>,
  getParentTitle: GetTitleCallback,
}

export type SetRouteTitleCallback<TRoute extends Route = Route> = (to: ResolvedRouteUnion<TRoute>, context: SetRouteTitleContext<TRoute>) => MaybePromise<string>
export type GetRouteTitle<TRoute extends Route = Route> = (to: ResolvedRouteUnion<TRoute>) => Promise<string | undefined>
export type SetRouteTitle<TRoute extends Route = Route, TReturn = void> = (callback: SetRouteTitleCallback<TRoute>) => TReturn

export type RouteSetTitle<TRoute extends Route = Route> = {
  /**
   * Adds a callback to set the document title for the route.
   */
  setTitle: SetRouteTitle<TRoute>,
}

export type RouteTitle<
  TUrl extends Url = Url,
  TMatches extends CreatedRouteOptions[] = CreatedRouteOptions[]
> = {
  setTitle: SetRouteTitle<Route<TUrl, TMatches>, RouteWithMethods<TUrl, TMatches>>,
}

type CreateRouteTitle = {
  setTitle: SetRouteTitle,
  getTitle: GetRouteTitle,
}

export function createRouteTitle(parent?: Route): CreateRouteTitle {
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
