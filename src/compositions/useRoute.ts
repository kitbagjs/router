import { InjectionKey, watch } from 'vue'
import { createUseRouter } from '@/compositions/useRouter'
import { UseRouteInvalidError } from '@/errors/useRouteInvalidError'
import { IsRouteOptions, createIsRoute } from '@/guards/routes'
import { Router, RouterRouteName } from '@/types/router'

type UseRouteFunction<TRouter extends Router> = {
  (): TRouter['route'],
  <
    TRouteName extends RouterRouteName<TRouter>
  >(routeName: TRouteName, options: IsRouteOptions & { exact: true }): TRouter['route'] & { name: TRouteName },
  <
    TRouteName extends RouterRouteName<TRouter>
  >(routeName: TRouteName, options?: IsRouteOptions): TRouter['route'] & { name: `${TRouteName}${string}` },
}

export function createUseRoute<TRouter extends Router>(routerKey: InjectionKey<TRouter>): UseRouteFunction<TRouter> {
  const useRouter = createUseRouter(routerKey)
  const isRoute = createIsRoute(routerKey)

  return (routeName?: string, options?: IsRouteOptions): TRouter['route'] => {
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
