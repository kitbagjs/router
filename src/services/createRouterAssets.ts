import { Router, RouterRoutes, RouterRejections } from '@/types/router'
import { InjectionKey } from 'vue'
import { createComponentHooks } from './createComponentHooks'
import { createRouterView } from '@/components/routerView'
import { createRouterLink } from '@/components/routerLink'
import { createUseRoute } from '@/compositions/useRoute'
import { createUseRouter } from '@/compositions/useRouter'
import { createUseQueryValue } from '@/compositions/useQueryValue'
import { createUseLink } from '@/compositions/useLink'
import { createIsRoute } from '@/guards/routes'
import { AddRouterAfterRouteHook, AddRouterBeforeRouteHook } from '@/types/hooks'

export type RouterAssets<TRouter extends Router> = {
  /**
   * Registers a hook that is called before a route is left. Must be called from setup.
   * This is useful for performing actions or cleanups before navigating away from a route component.
   *
   * @param BeforeRouteHook - The hook callback function
   * @returns {RouteHookRemove} A function that removes the added hook.
   * @group Hooks
   */
  onBeforeRouteLeave: AddRouterBeforeRouteHook<RouterRoutes<TRouter>, RouterRejections<TRouter>>,

  /**
   * Registers a hook that is called before a route is updated. Must be called from setup.
   * This is particularly useful for handling changes in route parameters or query while staying within the same component.
   *
   * @param BeforeRouteHook - The hook callback function
   * @returns {RouteHookRemove} A function that removes the added hook.
   * @group Hooks
   */
  onBeforeRouteUpdate: AddRouterBeforeRouteHook<RouterRoutes<TRouter>, RouterRejections<TRouter>>,

  /**
   * Registers a hook that is called after a route has been left. Must be called during setup.
   * This can be used for cleanup actions after the component is no longer active, ensuring proper resource management.
   *
   * @param AfterRouteHook - The hook callback function
   * @returns {RouteHookRemove} A function that removes the added hook.
   * @group Hooks
   */
  onAfterRouteLeave: AddRouterAfterRouteHook<RouterRoutes<TRouter>, RouterRejections<TRouter>>,

  /**
   * Registers a hook that is called after a route has been updated. Must be called during setup.
   * This is ideal for responding to updates within the same route, such as parameter changes, without full component reloads.
   *
   * @param AfterRouteHook - The hook callback function
   * @returns {RouteHookRemove} A function that removes the added hook.
   * @group Hooks
   */
  onAfterRouteUpdate: AddRouterAfterRouteHook<RouterRoutes<TRouter>, RouterRejections<TRouter>>,

  /**
   * A guard to verify if a route or unknown value matches a given route name.
   *
   * @param routeName - The name of the route to check against the current route.
   * @returns True if the current route matches the given route name, false otherwise.
   * @group Guards
   */
  isRoute: ReturnType<typeof createIsRoute<TRouter>>,

  /**
   * A component to render the current route's component.
   *
   * @param props - The props to pass to the router view component.
   * @returns The router view component.
   * @group Components
   */
  RouterView: ReturnType<typeof createRouterView<TRouter>>,

  /**
   * A component to render a link to a route or any url.
   *
   * @param props - The props to pass to the router link component.
   * @returns The router link component.
   * @group Components
   */
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
   * @template TRouteName - A string type that should match route name of `RouterRouteName<TRouter>`, ensuring the route name exists.
   * @param routeName - Optional. The name of the route to validate against the current active routes.
   * @returns The current router route. If a route name is provided, it validates the route name first.
   * @throws {UseRouteInvalidError} Throws an error if the provided route name is not valid or does not match the current route.
   * @group Compositions
   */
  useRoute: ReturnType<typeof createUseRoute<TRouter>>,

  /**
   * A composition to access the installed router instance within a Vue component.
   *
   * @returns The installed router instance.
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
   * A composition to export much of the functionality that drives RouterLink component.
   * Also exports some useful context about routes relationship to current URL and convenience methods
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

export function createRouterAssets<TRouter extends Router>(router: TRouter): RouterAssets<TRouter>
export function createRouterAssets<TRouter extends Router>(routerKey: InjectionKey<TRouter>): RouterAssets<TRouter>
export function createRouterAssets<TRouter extends Router>(routerOrRouterKey: TRouter | InjectionKey<TRouter>): RouterAssets<TRouter> {
  const routerKey: InjectionKey<TRouter> = typeof routerOrRouterKey === 'object' ? routerOrRouterKey.key : routerOrRouterKey

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
