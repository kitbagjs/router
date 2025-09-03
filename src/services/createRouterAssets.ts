import { AddAfterRouteHook, AddBeforeRouteHook, Router } from '@/types'
import { InjectionKey } from 'vue'
import { createComponentHooks } from './createComponentHooks'
import { createRouterView } from '@/components/routerView'
import { createRouterLink } from '@/components/routerLink'
import { createUseRoute } from '@/compositions/useRoute'
import { createUseRouter } from '@/compositions/useRouter'
import { createUseQueryValue } from '@/compositions/useQueryValue'
import { createUseLink } from '@/compositions/useLink'
import { createIsRoute } from '@/guards/routes'

type RouterAssets<TRouter extends Router> = {
  onBeforeRouteLeave: AddBeforeRouteHook,
  onBeforeRouteUpdate: AddBeforeRouteHook,
  onAfterRouteLeave: AddAfterRouteHook,
  onAfterRouteUpdate: AddAfterRouteHook,
  isRoute: ReturnType<typeof createIsRoute<TRouter>>,
  RouterView: ReturnType<typeof createRouterView<TRouter>>,
  RouterLink: ReturnType<typeof createRouterLink<TRouter>>,

  /**
   * A composition to access the current route or verify a specific route name within a Vue component.
   * This function provides two overloads:
   * 1. When called without arguments, it returns the current route from the router without types.
   * 2. When called with a route name, it checks if the current active route includes the specified route name.
   *
   * The function also sets up a reactive watcher on the route object from the router to continually check the validity of the route name
   * if provided, throwing an error if the validation fails at any point during the component's lifecycle.
   *
   * @template TRouteName - A string type that should match route name of RegisteredRouteMap, ensuring the route name exists.
   * @param routeName - Optional. The name of the route to validate against the current active routes.
   * @returns The current router route. If a route name is provided, it validates the route name first.
   * @throws {UseRouteInvalidError} Throws an error if the provided route name is not valid or does not match the current route.
   * @group Compositions
   */
  useRoute: ReturnType<typeof createUseRoute<TRouter>>,

  /**
   * A composition to access the registered router instance within a Vue component.
   *
   * @returns The registered router instance.
   * @throws {RouterNotInstalledError} Throws an error if the router has not been installed,
   *         ensuring the component does not operate without routing functionality.
   * @group Compositions
   */
  useRouter: ReturnType<typeof createUseRouter<TRouter>>,

  /**
   * A composition to access a specific query value from the current route.
   *
   * @returns The query value from the router.
   * @group Compositions
   */
  useQueryValue: ReturnType<typeof createUseQueryValue<TRouter>>,

  /**
   * A composition to export much of the functionality that drives RouterLink component. Can be given route details to discover resolved URL,
   * or resolved URL to discover route details. Also exports some useful context about routes relationship to current URL and convenience methods
   * for navigating.
   *
   * @param source - The name of the route or a valid URL.
   * @param params - If providing route name, this argument will expect corresponding params.
   * @param options - {@link RouterResolveOptions} Same options as router resolve.
   * @returns {UseLink} Reactive context values for as well as navigation methods.
   * @group Compositions
   */
  useLink: ReturnType<typeof createUseLink<TRouter>>,
}

export function createRouterAssets(routerKey: InjectionKey<Router>): RouterAssets<Router> {
  const {
    onBeforeRouteLeave,
    onBeforeRouteUpdate,
    onAfterRouteLeave,
    onAfterRouteUpdate,
  } = createComponentHooks(routerKey)

  const isRoute = createIsRoute(routerKey)

  const RouterView = createRouterView(routerKey)
  const RouterLink = createRouterLink(routerKey)

  const useRoute = createUseRoute(routerKey)
  const useRouter = createUseRouter(routerKey)
  const useQueryValue = createUseQueryValue(routerKey)
  const useLink = createUseLink(routerKey)

  return {
    onBeforeRouteLeave,
    onBeforeRouteUpdate,
    onAfterRouteLeave,
    onAfterRouteUpdate,
    isRoute,
    RouterView,
    RouterLink,
    useRoute,
    useRouter,
    useQueryValue,
    useLink,
  }
}
