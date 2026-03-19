import { ResolvedRoute, ResolvedRouteUnion } from '@/types/resolved'
import { isRoute, Route } from './route'
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

type CreateRouteTitle = {
  setTitle: SetTitle,
  getTitle: GetTitle,
}

export function createRouteTitle(parent: Route | undefined): CreateRouteTitle {
  let setTitleCallback: SetTitleCallback | undefined

  const setTitle: SetTitle = (callback) => {
    setTitleCallback = callback
  }

  const getTitle: GetTitle = async (to) => {
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
