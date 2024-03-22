import { onUnmounted } from 'vue'
import { useRouteHooks } from '@/compositions/useRouteHooks'
import { useRouterDepth } from '@/compositions/useRouterDepth'
import { AddAfterRouteHook, AddBeforeRouteHook, AfterRouteHook, AfterRouteHookLifecycle, BeforeRouteHook, BeforeRouteHookLifecycle } from '@/types/hooks'

function beforeComponentHookFactory(lifecycle: BeforeRouteHookLifecycle) {
  return (hook: BeforeRouteHook) => {
    const depth = useRouterDepth()
    const hooks = useRouteHooks()

    const remove = hooks.addBeforeRouteHook({ lifecycle, hook, depth, timing: 'component' })

    onUnmounted(remove)

    return remove
  }
}

function afterComponentHookFactory(lifecycle: AfterRouteHookLifecycle) {
  return (hook: AfterRouteHook) => {
    const depth = useRouterDepth()
    const hooks = useRouteHooks()

    const remove = hooks.addAfterRouteHook({ lifecycle, hook, depth, timing: 'component' })

    onUnmounted(remove)

    return remove
  }
}

export const useOnBeforeRouteLeave: AddBeforeRouteHook = beforeComponentHookFactory('onBeforeRouteUpdate')
export const useOnBeforeRouteUpdate: AddBeforeRouteHook = beforeComponentHookFactory('onBeforeRouteLeave')
export const useOnAfterRouteEnter: AddAfterRouteHook = afterComponentHookFactory('onAfterRouteEnter')
export const useOnAfterRouteLeave: AddAfterRouteHook = afterComponentHookFactory('onAfterRouteUpdate')
export const useOnAfterRouteUpdate: AddAfterRouteHook = afterComponentHookFactory('onAfterRouteLeave')