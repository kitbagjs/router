import { watch } from 'vue'
import { useRouter } from '@/compositions/useRouter'
import { UseRouteInvalidError } from '@/errors'
import { IsRouteOptions, isRoute } from '@/guards/routes'
import { RegisteredRouterRoute, RegisteredRoutesName } from '@/types/register'

/**
 * A composition to access the current route or verify a specific route name within a Vue component.
 * This function provides two overloads:
 * 1. When called without arguments, it returns the current route from the router without types.
 * 2. When called with a route name, it checks if the current active route includes the specified route name.
 *
 * @template TRouteName - A string type that should match route name of RegisteredRouteMap, ensuring the route name exists.
 * @param routeName - Optional. The name of the route to validate against the current active routes.
 * @returns The current router route. If a route name is provided, it validates the route name first.
 * @throws {UseRouteInvalidError} Throws an error if the provided route name is not valid or does not match the current route.
 *
 * The function also sets up a reactive watcher on the route object from the router to continually check the validity of the route name
 * if provided, throwing an error if the validation fails at any point during the component's lifecycle.
 */
export function useRoute(): RegisteredRouterRoute

export function useRoute<
  TRouteName extends RegisteredRoutesName
>(routeName: TRouteName, options: IsRouteOptions & { exact: true }): RegisteredRouterRoute & { name: TRouteName }

export function useRoute<
  TRouteName extends RegisteredRoutesName
>(routeName: TRouteName, options?: IsRouteOptions): RegisteredRouterRoute & { name: `${TRouteName}${string}` }

export function useRoute(routeName?: string, options?: IsRouteOptions): RegisteredRouterRoute {
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