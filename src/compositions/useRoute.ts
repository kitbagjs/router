import { watch } from 'vue'
import { useRouter } from '@/compositions/useRouter'
import { UseRouteInvalidError } from '@/errors'
import { isRoute } from '@/guards/routes'
import { RouterRoute, isRouterRoute } from '@/services/createRouterRoute'
import { RegisteredRouteMap } from '@/types/register'
import { ResolvedRoute } from '@/types/resolved'

export type UseRouteOptions = {
  exact?: boolean,
}

/**
 * A composition to access the current route or verify a specific route key within a Vue component.
 * This function provides two overloads:
 * 1. When called without arguments, it returns the current route from the router without types.
 * 2. When called with a route key, it checks if the current active route includes the specified route key.
 *
 * @template TRouteKey - A string type that should match route key of RegisteredRouteMap, ensuring the route key exists.
 * @param routeKey - Optional. The key of the route to validate against the current active routes.
 * @returns The current router route. If a route key is provided, it validates the route key first.
 * @throws {UseRouteInvalidError} Throws an error if the provided route key is not valid or does not match the current route.
 *
 * The function also sets up a reactive watcher on the route object from the router to continually check the validity of the route key
 * if provided, throwing an error if the validation fails at any point during the component's lifecycle.
 */
export function useRoute<TRouteKey extends string & keyof RegisteredRouteMap>(routeKey: TRouteKey, options?: UseRouteOptions): RouterRoute<ResolvedRoute<RegisteredRouteMap[TRouteKey]>>
export function useRoute(): RouterRoute
export function useRoute(routeKey?: string, { exact }: UseRouteOptions = {}): RouterRoute {
  const router = useRouter()

  function checkRouteKeyIsValid(): void {
    if (!routeKey) {
      return
    }

    const routeKeyIsValid = isRoute(router.route, routeKey, { exact })

    if (!routeKeyIsValid) {
      throw new UseRouteInvalidError(routeKey, router.route.key)
    }
  }

  watch(router.route, checkRouteKeyIsValid, { immediate: true, deep: true })

  return router.route
}