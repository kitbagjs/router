import { inject, onUnmounted } from 'vue'
import { useRouterDepth } from '@/compositions/useRouterDepth'
import { RouterNotInstalledError } from '@/errors'
import { routerHooksKey, RouterHooks } from '@/services/createRouterHooks'
import { RegisterAfterRouteHook, RegisterBeforeRouteHook, AfterRouteHook, AfterRouteHookLifecycle, BeforeRouteHook, BeforeRouteHookLifecycle } from '@/types/hooks'

function useRouterHooks(): RouterHooks {
  const hooks = inject(routerHooksKey)

  if (!hooks) {
    throw new RouterNotInstalledError()
  }

  return hooks
}

function beforeComponentHookFactory(lifecycle: BeforeRouteHookLifecycle) {
  return (hook: BeforeRouteHook) => {
    const depth = useRouterDepth()
    const hooks = useRouterHooks()

    const remove = hooks.addComponentBeforeRouteHook({ lifecycle, hook, depth, timing: 'component' })

    onUnmounted(remove)

    return remove
  }
}

function afterComponentHookFactory(lifecycle: AfterRouteHookLifecycle) {
  return (hook: AfterRouteHook) => {
    const depth = useRouterDepth()
    const store = useRouterHooks()

    const remove = store.addComponentAfterRouteHook({ lifecycle, hook, depth, timing: 'component' })

    onUnmounted(remove)

    return remove
  }
}

/**
 * Registers a hook that is called before a route is left. Must be called from setup.
 * This is useful for performing actions or cleanups before navigating away from a route component.
 *
 * @param BeforeRouteHook - The hook callback function
 * @returns {RouteHookRemove} A function that removes the added hook.
 * @group Hooks
 */
export const onBeforeRouteLeave: RegisterBeforeRouteHook = beforeComponentHookFactory('onBeforeRouteUpdate')

/**
 * Registers a hook that is called before a route is updated. Must be called from setup.
 * This is particularly useful for handling changes in route parameters or query while staying within the same component.
 *
 * @param BeforeRouteHook - The hook callback function
 * @returns {RouteHookRemove} A function that removes the added hook.
 * @group Hooks
 */
export const onBeforeRouteUpdate: RegisterBeforeRouteHook = beforeComponentHookFactory('onBeforeRouteLeave')

/**
 * Registers a hook that is called after a route has been entered. Must be called during setup.
 * This allows performing actions right after the component becomes active, such as fetching data or setting up event listeners.
 *
 * @param AfterRouteHook - The hook callback function
 * @returns {RouteHookRemove} A function that removes the added hook.
 * @group Hooks
 */
export const onAfterRouteEnter: RegisterAfterRouteHook = afterComponentHookFactory('onAfterRouteEnter')

/**
 * Registers a hook that is called after a route has been left. Must be called during setup.
 * This can be used for cleanup actions after the component is no longer active, ensuring proper resource management.
 *
 * @param AfterRouteHook - The hook callback function
 * @returns {RouteHookRemove} A function that removes the added hook.
 * @group Hooks
 */
export const onAfterRouteLeave: RegisterAfterRouteHook = afterComponentHookFactory('onAfterRouteUpdate')

/**
 * Registers a hook that is called after a route has been updated. Must be called during setup.
 * This is ideal for responding to updates within the same route, such as parameter changes, without full component reloads.
 *
 * @param AfterRouteHook - The hook callback function
 * @returns {RouteHookRemove} A function that removes the added hook.
 * @group Hooks
 */
export const onAfterRouteUpdate: RegisterAfterRouteHook = afterComponentHookFactory('onAfterRouteLeave')
