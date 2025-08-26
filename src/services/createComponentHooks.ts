import { onUnmounted } from 'vue'
import { createUseRouterDepth } from '@/compositions/useRouterDepth'
import { createUseRouterHooks } from '@/compositions/useRouterHooks'
import { Router } from '@/types/router'
import { AddAfterRouteHook, AddBeforeRouteHook, AfterRouteHook, AfterRouteHookLifecycle, BeforeRouteHook, BeforeRouteHookLifecycle } from '@/types/hooks'
import { InjectionKey } from 'vue'

function beforeComponentHookFactory(routerKey: InjectionKey<Router>, lifecycle: BeforeRouteHookLifecycle) {
  const useRouterDepth = createUseRouterDepth(routerKey)
  const useRouterHooks = createUseRouterHooks(routerKey)

  return (hook: BeforeRouteHook) => {
    const depth = useRouterDepth()
    const hooks = useRouterHooks()

    const remove = hooks.addComponentBeforeRouteHook({ lifecycle, hook, depth: depth - 1 })

    onUnmounted(remove)

    return remove
  }
}

function afterComponentHookFactory(routerKey: InjectionKey<Router>, lifecycle: AfterRouteHookLifecycle) {
  const useRouterDepth = createUseRouterDepth(routerKey)
  const useRouterHooks = createUseRouterHooks(routerKey)

  return (hook: AfterRouteHook) => {
    const depth = useRouterDepth()
    const hooks = useRouterHooks()

    const remove = hooks.addComponentAfterRouteHook({ lifecycle, hook, depth: depth - 1 })

    onUnmounted(remove)

    return remove
  }
}

type ComponentHooks = {
  /**
   * Registers a hook that is called before a route is left. Must be called from setup.
   * This is useful for performing actions or cleanups before navigating away from a route component.
   *
   * @param BeforeRouteHook - The hook callback function
   * @returns {RouteHookRemove} A function that removes the added hook.
   * @group Hooks
   */
  onBeforeRouteLeave: AddBeforeRouteHook,
  /**
 * Registers a hook that is called before a route is updated. Must be called from setup.
 * This is particularly useful for handling changes in route parameters or query while staying within the same component.
 *
 * @param BeforeRouteHook - The hook callback function
 * @returns {RouteHookRemove} A function that removes the added hook.
 * @group Hooks
 */
  onBeforeRouteUpdate: AddBeforeRouteHook,
  /**
 * Registers a hook that is called after a route has been left. Must be called during setup.
 * This can be used for cleanup actions after the component is no longer active, ensuring proper resource management.
 *
 * @param AfterRouteHook - The hook callback function
 * @returns {RouteHookRemove} A function that removes the added hook.
 * @group Hooks
 */
  onAfterRouteLeave: AddAfterRouteHook,
  /**
 * Registers a hook that is called after a route has been updated. Must be called during setup.
 * This is ideal for responding to updates within the same route, such as parameter changes, without full component reloads.
 *
 * @param AfterRouteHook - The hook callback function
 * @returns {RouteHookRemove} A function that removes the added hook.
 * @group Hooks
 */
  onAfterRouteUpdate: AddAfterRouteHook,
}

export function createComponentHooks<TRouter extends Router>(routerKey: InjectionKey<TRouter>): ComponentHooks {
  const onBeforeRouteLeave = beforeComponentHookFactory(routerKey, 'onBeforeRouteLeave')
  const onBeforeRouteUpdate = beforeComponentHookFactory(routerKey, 'onBeforeRouteUpdate')
  const onAfterRouteLeave = afterComponentHookFactory(routerKey, 'onAfterRouteLeave')
  const onAfterRouteUpdate = afterComponentHookFactory(routerKey, 'onAfterRouteUpdate')

  return {
    onBeforeRouteLeave,
    onBeforeRouteUpdate,
    onAfterRouteLeave,
    onAfterRouteUpdate,
  }
}
