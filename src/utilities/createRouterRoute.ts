import { readonly } from 'vue'
import { ResolvedRoute } from '@/types/resolved'
import { RouteUpdate, RouteUpdateOptions, RouterUpdate } from '@/types/routerUpdate'

export type RouterRoute<TRoute extends ResolvedRoute = ResolvedRoute> = Omit<ResolvedRoute, 'params'> & Readonly<{
  params: TRoute['params'],
  update: RouteUpdate<TRoute>,
}>

export function createRouterRoute<TRoute extends ResolvedRoute>(route: TRoute, update: RouterUpdate): RouterRoute<TRoute> {
  return readonly({
    ...route,
    update: (keyOrParams: PropertyKey | Partial<ResolvedRoute['params']>, valueOrOptions: any, maybeOptions?: RouteUpdateOptions) => {
      if (typeof keyOrParams === 'object') {
        return update(route, keyOrParams, valueOrOptions)
      }

      const updatedParams = readonly({
        ...route.params,
        [keyOrParams]: valueOrOptions,
      })
      return update(route, updatedParams, maybeOptions)
    },
  })
}