import { InjectionKey, onUnmounted } from 'vue'
import { createUseRouterDepth } from '@/compositions/useRouterDepth'
import { createUseRouterHooks } from '@/compositions/useRouterHooks'
import { AddRouterAfterRouteHook, AddRouterBeforeRouteHook, Router, RouterAfterRouteHook, RouterBeforeRouteHook, RouterRoutes } from '@/types/router'
import { AfterRouteHookLifecycle, BeforeRouteHookLifecycle } from '@/types/hooks'
import { Routes } from '@/types/route'

function createComponentBeforeHook<TRouter extends Router>(routerKey: InjectionKey<TRouter>, lifecycle: BeforeRouteHookLifecycle): AddRouterBeforeRouteHook<RouterRoutes<TRouter>> {
  const useRouterDepth = createUseRouterDepth(routerKey)
  const useRouterHooks = createUseRouterHooks(routerKey)

  return (hook: RouterBeforeRouteHook<RouterRoutes<TRouter>>) => {
    const depth = useRouterDepth()
    const hooks = useRouterHooks()

    const remove = hooks.addComponentBeforeRouteHook({ lifecycle, hook, depth: depth - 1 })

    onUnmounted(remove)

    return remove
  }
}

function createComponentAfterHook<TRouter extends Router>(routerKey: InjectionKey<TRouter>, lifecycle: AfterRouteHookLifecycle): AddRouterAfterRouteHook<RouterRoutes<TRouter>> {
  const useRouterDepth = createUseRouterDepth(routerKey)
  const useRouterHooks = createUseRouterHooks(routerKey)

  return (hook: RouterAfterRouteHook<RouterRoutes<TRouter>>) => {
    const depth = useRouterDepth()
    const hooks = useRouterHooks()

    const remove = hooks.addComponentAfterRouteHook({ lifecycle, hook, depth: depth - 1 })

    onUnmounted(remove)

    return remove
  }
}

type ComponentHooks<TRoutes extends Routes> = {
  onBeforeRouteLeave: AddRouterBeforeRouteHook<TRoutes>,
  onBeforeRouteUpdate: AddRouterBeforeRouteHook<TRoutes>,
  onAfterRouteLeave: AddRouterAfterRouteHook<TRoutes>,
  onAfterRouteUpdate: AddRouterAfterRouteHook<TRoutes>,
}

export function createComponentHooks<TRouter extends Router>(routerKey: InjectionKey<TRouter>): ComponentHooks<RouterRoutes<TRouter>> {
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
