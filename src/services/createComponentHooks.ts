import { InjectionKey, onUnmounted } from 'vue'
import { createUseRouterDepth } from '@/compositions/useRouterDepth'
import { createUseRouterHooks } from '@/compositions/useRouterHooks'
import { AddAfterHook, AddBeforeHook, AfterHookLifecycle, BeforeHookLifecycle, AfterHook, BeforeHook } from '@/types/hooks'
import { Routes } from '@/types/route'
import { Router, RouterRejections, RouterRoutes } from '@/types/router'
import { Rejections } from '@/types/rejection'

function createComponentBeforeHook<TRouter extends Router>(routerKey: InjectionKey<TRouter>, lifecycle: BeforeHookLifecycle): AddBeforeHook<RouterRoutes<TRouter>[number], RouterRoutes<TRouter>, RouterRejections<TRouter>>
function createComponentBeforeHook(routerKey: symbol, lifecycle: BeforeHookLifecycle): AddBeforeHook {
  const useRouterDepth = createUseRouterDepth(routerKey)
  const useRouterHooks = createUseRouterHooks(routerKey)

  return (hook: BeforeHook) => {
    const depth = useRouterDepth()
    const hooks = useRouterHooks()

    const remove = hooks.addComponentBeforeRouteHook({ lifecycle, hook, depth: depth - 1 })

    onUnmounted(remove)

    return remove
  }
}

function createComponentAfterHook<TRouter extends Router>(routerKey: InjectionKey<TRouter>, lifecycle: AfterHookLifecycle): AddAfterHook<RouterRoutes<TRouter>[number], RouterRoutes<TRouter>, RouterRejections<TRouter>>
function createComponentAfterHook(routerKey: symbol, lifecycle: AfterHookLifecycle): AddAfterHook {
  const useRouterDepth = createUseRouterDepth(routerKey)
  const useRouterHooks = createUseRouterHooks(routerKey)

  return (hook: AfterHook) => {
    const depth = useRouterDepth()
    const hooks = useRouterHooks()

    const remove = hooks.addComponentAfterRouteHook({ lifecycle, hook, depth: depth - 1 })

    onUnmounted(remove)

    return remove
  }
}

type ComponentHooks<
  TRoutes extends Routes,
  TRejections extends Rejections
> = {
  onBeforeRouteLeave: AddBeforeHook<TRoutes[number], TRoutes, TRejections>,
  onBeforeRouteUpdate: AddBeforeHook<TRoutes[number], TRoutes, TRejections>,
  onAfterRouteLeave: AddAfterHook<TRoutes[number], TRoutes, TRejections>,
  onAfterRouteUpdate: AddAfterHook<TRoutes[number], TRoutes, TRejections>,
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
