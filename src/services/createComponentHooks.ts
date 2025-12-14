import { InjectionKey, onUnmounted } from 'vue'
import { createUseRouterDepth } from '@/compositions/useRouterDepth'
import { createUseRouterHooks } from '@/compositions/useRouterHooks'
import { AddRouterAfterRouteHook, AddRouterBeforeRouteHook, AfterRouteHookLifecycle, BeforeRouteHookLifecycle, RouterAfterRouteHook, RouterBeforeRouteHook } from '@/types/hooks'
import { Routes } from '@/types/route'
import { Router, RouterRejections, RouterRoutes } from '@/types/router'

function createComponentBeforeHook<TRouter extends Router>(routerKey: InjectionKey<TRouter>, lifecycle: BeforeRouteHookLifecycle): AddRouterBeforeRouteHook<RouterRoutes<TRouter>, RouterRejections<TRouter>> {
  const useRouterDepth = createUseRouterDepth(routerKey)
  const useRouterHooks = createUseRouterHooks(routerKey)

  return (hook: RouterBeforeRouteHook<RouterRoutes<TRouter>, RouterRejections<TRouter>>) => {
    const depth = useRouterDepth()
    const hooks = useRouterHooks()

    const remove = hooks.addComponentBeforeRouteHook({ lifecycle, hook, depth: depth - 1 })

    onUnmounted(remove)

    return remove
  }
}

function createComponentAfterHook<TRouter extends Router>(routerKey: InjectionKey<TRouter>, lifecycle: AfterRouteHookLifecycle): AddRouterAfterRouteHook<RouterRoutes<TRouter>, RouterRejections<TRouter>> {
  const useRouterDepth = createUseRouterDepth(routerKey)
  const useRouterHooks = createUseRouterHooks(routerKey)

  return (hook: RouterAfterRouteHook<RouterRoutes<TRouter>, RouterRejections<TRouter>>) => {
    const depth = useRouterDepth()
    const hooks = useRouterHooks()

    const remove = hooks.addComponentAfterRouteHook({ lifecycle, hook, depth: depth - 1 })

    onUnmounted(remove)

    return remove
  }
}

type ComponentHooks<
  TRoutes extends Routes,
  TRejections extends string
> = {
  onBeforeRouteLeave: AddRouterBeforeRouteHook<TRoutes, TRejections>,
  onBeforeRouteUpdate: AddRouterBeforeRouteHook<TRoutes, TRejections>,
  onAfterRouteLeave: AddRouterAfterRouteHook<TRoutes, TRejections>,
  onAfterRouteUpdate: AddRouterAfterRouteHook<TRoutes, TRejections>,
}

export function createComponentHooks<TRouter extends Router>(routerKey: InjectionKey<TRouter>): ComponentHooks<RouterRoutes<TRouter>, RouterRejections<TRouter>> {
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
