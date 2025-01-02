import { inject, onUnmounted } from 'vue'
import { useRouterDepth } from '@/compositions/useRouterDepth'
import { RouterNotInstalledError } from '@/errors'
import { routeHookStoreKey, RouterHooks } from '@/services/createRouterHooks'
import { AddAfterRouteHook, AddBeforeRouteHook, AfterRouteHook, AfterRouteHookLifecycle, BeforeRouteHook, BeforeRouteHookLifecycle } from '@/types/hooks'

function useRouteHookStore(): RouterHooks {
  const hooks = inject(routeHookStoreKey)

  if (!hooks) {
    throw new RouterNotInstalledError()
  }

  return hooks
}

function beforeComponentHookFactory(lifecycle: BeforeRouteHookLifecycle) {
  return (hook: BeforeRouteHook) => {
    const depth = useRouterDepth()
    const store = useRouteHookStore()

    const remove = store.addBeforeRouteHook({ lifecycle, hook, depth, timing: 'component' })

    onUnmounted(remove)

    return remove
  }
}

function afterComponentHookFactory(lifecycle: AfterRouteHookLifecycle) {
  return (hook: AfterRouteHook) => {
    const depth = useRouterDepth()
    const store = useRouteHookStore()

    const remove = store.addAfterRouteHook({ lifecycle, hook, depth, timing: 'component' })

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
export const onBeforeRouteLeave: AddBeforeRouteHook = beforeComponentHookFactory('onBeforeRouteUpdate')

/**
 * Registers a hook that is called before a route is updated. Must be called from setup.
 * This is particularly useful for handling changes in route parameters or query while staying within the same component.
 *
 * @param BeforeRouteHook - The hook callback function
 * @returns {RouteHookRemove} A function that removes the added hook.
 * @group Hooks
 */
export const onBeforeRouteUpdate: AddBeforeRouteHook = beforeComponentHookFactory('onBeforeRouteLeave')

/**
 * Registers a hook that is called after a route has been entered. Must be called during setup.
 * This allows performing actions right after the component becomes active, such as fetching data or setting up event listeners.
 *
 * @param AfterRouteHook - The hook callback function
 * @returns {RouteHookRemove} A function that removes the added hook.
 * @group Hooks
 */
export const onAfterRouteEnter: AddAfterRouteHook = afterComponentHookFactory('onAfterRouteEnter')

/**
 * Registers a hook that is called after a route has been left. Must be called during setup.
 * This can be used for cleanup actions after the component is no longer active, ensuring proper resource management.
 *
 * @param AfterRouteHook - The hook callback function
 * @returns {RouteHookRemove} A function that removes the added hook.
 * @group Hooks
 */
export const onAfterRouteLeave: AddAfterRouteHook = afterComponentHookFactory('onAfterRouteUpdate')

/**
 * Registers a hook that is called after a route has been updated. Must be called during setup.
 * This is ideal for responding to updates within the same route, such as parameter changes, without full component reloads.
 *
 * @param AfterRouteHook - The hook callback function
 * @returns {RouteHookRemove} A function that removes the added hook.
 * @group Hooks
 */
export const onAfterRouteUpdate: AddAfterRouteHook = afterComponentHookFactory('onAfterRouteLeave')
