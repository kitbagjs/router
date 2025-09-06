import { InjectionKey, onUnmounted } from 'vue'
import { createUseRouterDepth } from '@/compositions/useRouterDepth'
import { createUseRouterHooks } from '@/compositions/useRouterHooks'
import { Router } from '@/types/router'
import { AddAfterRouteHook, AddBeforeRouteHook, AfterRouteHook, AfterRouteHookLifecycle, BeforeRouteHook, BeforeRouteHookLifecycle } from '@/types/hooks'

function createComponentBeforeHook(routerKey: InjectionKey<Router>, lifecycle: BeforeRouteHookLifecycle) {
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

function createComponentAfterHook(routerKey: InjectionKey<Router>, lifecycle: AfterRouteHookLifecycle) {
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
  onBeforeRouteLeave: AddBeforeRouteHook,
  onBeforeRouteUpdate: AddBeforeRouteHook,
  onAfterRouteLeave: AddAfterRouteHook,
  onAfterRouteUpdate: AddAfterRouteHook,
}

export function createComponentHooks<TRouter extends Router>(routerKey: InjectionKey<TRouter>): ComponentHooks {
  const onBeforeRouteLeave = createComponentBeforeHook(routerKey, 'onBeforeRouteLeave')
  const onBeforeRouteUpdate = createComponentBeforeHook(routerKey, 'onBeforeRouteUpdate')
  const onAfterRouteLeave = createComponentAfterHook(routerKey, 'onAfterRouteLeave')
  const onAfterRouteUpdate = createComponentAfterHook(routerKey, 'onAfterRouteUpdate')

  return {
    onBeforeRouteLeave,
    onBeforeRouteUpdate,
    onAfterRouteLeave,
    onAfterRouteUpdate,
  }
}
