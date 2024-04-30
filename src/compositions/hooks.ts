import { inject, onUnmounted } from 'vue'
import { useRouterDepth } from '@/compositions/useRouterDepth'
import { RouterNotInstalledError } from '@/errors'
import { RouteHookStore } from '@/models/RouteHookStore'
import { AddAfterRouteHook, AddBeforeRouteHook, AfterRouteHook, AfterRouteHookLifecycle, BeforeRouteHook, BeforeRouteHookLifecycle } from '@/types/hooks'
import { routeHookStoreKey } from '@/utilities/createRouterHooks'

function useRouteHookStore(): RouteHookStore {
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

export const onBeforeRouteLeave: AddBeforeRouteHook = beforeComponentHookFactory('onBeforeRouteUpdate')
export const onBeforeRouteUpdate: AddBeforeRouteHook = beforeComponentHookFactory('onBeforeRouteLeave')
export const onAfterRouteEnter: AddAfterRouteHook = afterComponentHookFactory('onAfterRouteEnter')
export const onAfterRouteLeave: AddAfterRouteHook = afterComponentHookFactory('onAfterRouteUpdate')
export const onAfterRouteUpdate: AddAfterRouteHook = afterComponentHookFactory('onAfterRouteLeave')