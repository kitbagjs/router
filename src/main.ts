// Types
export * from './types/createRouteOptions'
export * from './types/hooks'
export * from './types/paramTypes'
export * from './types/prefetch'
export * from './types/props'
export * from './types/querySource'
export * from './types/register'
export * from './types/resolved'
export * from './types/route'
export * from './types/router'
export * from './types/routerLink'
export * from './types/routerPlugin'
export * from './types/routerPush'
export * from './types/routerPush'
export * from './types/routerReject'
export * from './types/routerReplace'
export * from './types/routerReplace'
export * from './types/routerResolve'
export * from './types/routerResolve'
export * from './types/routerRoute'
export * from './types/url'
export * from './types/useLink'

// Errors
export { DuplicateParamsError } from './errors/duplicateParamsError'
export { MetaPropertyConflict } from './errors/metaPropertyConflict'
export { RouterNotInstalledError } from './errors/routerNotInstalledError'
export { UseRouteInvalidError } from './errors/useRouteInvalidError'

// Services
export { createRoute } from './services/createRoute'
export { createRejection } from './services/createRejection'
export { createExternalRoute } from './services/createExternalRoute'
export { createRouterAssets, type RouterAssets } from './services/createRouterAssets'
export { withParams } from './services/withParams'
export { withDefault } from './services/withDefault'
export { createRouterPlugin } from './services/createRouterPlugin'
export { unionOf } from './services/unionOf'
export { arrayOf } from './services/arrayOf'
export { tupleOf } from './services/tupleOf'
export { createParam } from './services/createParam'
export { createRouter } from './services/createRouter'

// Assets
import { routerInjectionKey } from './keys'
import { createRouterAssets, RouterAssets } from './services/createRouterAssets'
import { RegisteredRouter } from './types/register'

const routerAssets = createRouterAssets(routerInjectionKey)

/**
 * Registers a hook that is called before a route is left. Must be called from setup.
 * This is useful for performing actions or cleanups before navigating away from a route component.
 *
 * @param BeforeRouteHook - The hook callback function
 * @returns {RouteHookRemove} A function that removes the added hook.
 * @group Hooks
 */
export const onBeforeRouteLeave: RouterAssets<RegisteredRouter>['onBeforeRouteLeave'] = routerAssets.onBeforeRouteLeave

/**
 * Registers a hook that is called before a route is updated. Must be called from setup.
 * This is particularly useful for handling changes in route parameters or query while staying within the same component.
 *
 * @param BeforeRouteHook - The hook callback function
 * @returns {RouteHookRemove} A function that removes the added hook.
 * @group Hooks
 */
export const onBeforeRouteUpdate: RouterAssets<RegisteredRouter>['onBeforeRouteUpdate'] = routerAssets.onBeforeRouteUpdate

/**
 * Registers a hook that is called after a route has been left. Must be called during setup.
 * This can be used for cleanup actions after the component is no longer active, ensuring proper resource management.
 *
 * @param AfterRouteHook - The hook callback function
 * @returns {RouteHookRemove} A function that removes the added hook.
 * @group Hooks
 */
export const onAfterRouteLeave: RouterAssets<RegisteredRouter>['onAfterRouteLeave'] = routerAssets.onAfterRouteLeave

/**
 * Registers a hook that is called after a route has been updated. Must be called during setup.
 * This is ideal for responding to updates within the same route, such as parameter changes, without full component reloads.
 *
 * @param AfterRouteHook - The hook callback function
 * @returns {RouteHookRemove} A function that removes the added hook.
 * @group Hooks
 */
export const onAfterRouteUpdate: RouterAssets<RegisteredRouter>['onAfterRouteUpdate'] = routerAssets.onAfterRouteUpdate

/**
 * A guard to verify if a route or unknown value matches a given route name.
 *
 * @param routeName - The name of the route to check against the current route.
 * @returns True if the current route matches the given route name, false otherwise.
 * @group Type Guards
 */
export const isRoute: RouterAssets<RegisteredRouter>['isRoute'] = routerAssets.isRoute

/**
 * A component to render the current route's component.
 *
 * @param props - The props to pass to the router view component.
 * @returns The router view component.
 * @group Components
 */
export const RouterView: RouterAssets<RegisteredRouter>['RouterView'] = routerAssets.RouterView

/**
 * A component to render a link to a route or any url.
 *
 * @param props - The props to pass to the router link component.
 * @returns The router link component.
 * @group Components
 */
export const RouterLink: RouterAssets<RegisteredRouter>['RouterLink'] = routerAssets.RouterLink

/**
 * A composition to access the current route or verify a specific route name within a Vue component.
 * This function provides two overloads:
 * 1. When called without arguments, it returns the current route from the router without types.
 * 2. When called with a route name, it checks if the current active route includes the specified route name.
 *
 * The function also sets up a reactive watcher on the route object from the router to continually check the validity of the route name
 * if provided, throwing an error if the validation fails at any point during the component's lifecycle.
 *
 * @template TRouteName - A string type that should match route name of the registered router, ensuring the route name exists.
 * @param routeName - Optional. The name of the route to validate against the current active routes.
 * @returns The current router route. If a route name is provided, it validates the route name first.
 * @throws {UseRouteInvalidError} Throws an error if the provided route name is not valid or does not match the current route.
 * @group Compositions
 */
export const useRoute: RouterAssets<RegisteredRouter>['useRoute'] = routerAssets.useRoute

/**
 * A composition to access the installed router instance within a Vue component.
 *
 * @returns The installed router instance.
 * @throws {RouterNotInstalledError} Throws an error if the router has not been installed,
 *         ensuring the component does not operate without routing functionality.
 * @group Compositions
 */
export const useRouter: RouterAssets<RegisteredRouter>['useRouter'] = routerAssets.useRouter

/**
 * A composition to access a specific query value from the current route.
 *
 * @returns The query value from the router.
 * @group Compositions
 */
export const useQueryValue: RouterAssets<RegisteredRouter>['useQueryValue'] = routerAssets.useQueryValue

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
export const useLink: RouterAssets<RegisteredRouter>['useLink'] = routerAssets.useLink

declare module 'vue' {
  export interface GlobalComponents {
    RouterView: typeof RouterView,
    RouterLink: typeof RouterLink,
  }
}
