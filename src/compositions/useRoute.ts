import { InjectionKey, watch } from 'vue'
import { createUseRouter } from '@/compositions/useRouter'
import { UseRouteInvalidError } from '@/errors/useRouteInvalidError'
import { IsRouteOptions, createIsRoute, RouteWithMatch } from '@/guards/routes'
import { Router, RouterRouteName } from '@/types/router'
import { RouterRoute } from '@/types/routerRoute'

type UseRouteFunction<TRouter extends Router> = {
  (): TRouter['route'],
  <
    const TRouteName extends RouterRouteName<TRouter>
  >(routeName: TRouteName, options: IsRouteOptions & { exact: true }): TRouter['route'] & { name: TRouteName },
  <
    const TRouteName extends RouterRouteName<TRouter>
  >(routeName: TRouteName, options?: IsRouteOptions): RouteWithMatch<TRouter['route'], TRouteName>,
}

export function createUseRoute<TRouter extends Router>(routerKey: InjectionKey<TRouter>): UseRouteFunction<TRouter>
export function createUseRoute(routerKey: InjectionKey<Router>): (routeName?: string, options?: IsRouteOptions) => RouterRoute {
  const useRouter = createUseRouter(routerKey)
  const isRoute = createIsRoute(routerKey)

  return (routeName?: string, options?: IsRouteOptions): RouterRoute => {
    const router = useRouter()

    function checkRouteNameIsValid(): void {
      if (!routeName) {
        return
      }

      const routeNameIsValid = isRoute(router.route, routeName, options)

      if (!routeNameIsValid) {
        throw new UseRouteInvalidError(routeName, router.route.name)
      }
    }

    watch(router.route, checkRouteNameIsValid, { immediate: true, deep: true })

    return router.route
  }
}
