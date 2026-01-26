import { InjectionKey, onUnmounted } from 'vue'
import { createUseRouterDepth } from '@/compositions/useRouterDepth'
import { createUseRouterHooks } from '@/compositions/useRouterHooks'
import { AddBeforeEnterHook, AddBeforeUpdateHook, AddBeforeLeaveHook, AddAfterEnterHook, AddAfterUpdateHook, AddAfterLeaveHook, HookLifecycle, ComponentHook, HookRemove } from '@/types/hooks'
import { Routes } from '@/types/route'
import { Router, RouterRejections, RouterRoutes } from '@/types/router'
import { Rejections } from '@/types/rejection'

function createComponentHook<TRouter extends Router>(routerKey: InjectionKey<TRouter>, lifecycle: 'onBeforeRouteEnter'): AddBeforeEnterHook<RouterRoutes<TRouter>, RouterRejections<TRouter>>
function createComponentHook<TRouter extends Router>(routerKey: InjectionKey<TRouter>, lifecycle: 'onBeforeRouteUpdate'): AddBeforeUpdateHook<RouterRoutes<TRouter>, RouterRejections<TRouter>>
function createComponentHook<TRouter extends Router>(routerKey: InjectionKey<TRouter>, lifecycle: 'onBeforeRouteLeave'): AddBeforeLeaveHook<RouterRoutes<TRouter>, RouterRejections<TRouter>>
function createComponentHook<TRouter extends Router>(routerKey: InjectionKey<TRouter>, lifecycle: 'onAfterRouteEnter'): AddAfterEnterHook<RouterRoutes<TRouter>, RouterRejections<TRouter>>
function createComponentHook<TRouter extends Router>(routerKey: InjectionKey<TRouter>, lifecycle: 'onAfterRouteUpdate'): AddAfterUpdateHook<RouterRoutes<TRouter>, RouterRejections<TRouter>>
function createComponentHook<TRouter extends Router>(routerKey: InjectionKey<TRouter>, lifecycle: 'onAfterRouteLeave'): AddAfterLeaveHook<RouterRoutes<TRouter>, RouterRejections<TRouter>>
function createComponentHook(routerKey: symbol, lifecycle: HookLifecycle): (hook: ComponentHook) => HookRemove {
  const useRouterDepth = createUseRouterDepth(routerKey)
  const useRouterHooks = createUseRouterHooks(routerKey)

  return (hook: ComponentHook) => {
    const depth = useRouterDepth()
    const hooks = useRouterHooks()

    const remove = hooks.addComponentHook({ lifecycle, hook, depth: depth - 1 })

    onUnmounted(remove)

    return remove
  }
}

type ComponentHooks<
  TRoutes extends Routes,
  TRejections extends Rejections
> = {
  onBeforeRouteLeave: AddBeforeLeaveHook<TRoutes, TRejections>,
  onBeforeRouteUpdate: AddBeforeUpdateHook<TRoutes, TRejections>,
  onAfterRouteLeave: AddAfterLeaveHook<TRoutes, TRejections>,
  onAfterRouteUpdate: AddAfterUpdateHook<TRoutes, TRejections>,
}

export function createComponentHooks<TRouter extends Router>(routerKey: InjectionKey<TRouter>): ComponentHooks<RouterRoutes<TRouter>, RouterRejections<TRouter>> {
  const onBeforeRouteLeave = createComponentHook(routerKey, 'onBeforeRouteLeave')
  const onBeforeRouteUpdate = createComponentHook(routerKey, 'onBeforeRouteUpdate')
  const onAfterRouteLeave = createComponentHook(routerKey, 'onAfterRouteLeave')
  const onAfterRouteUpdate = createComponentHook(routerKey, 'onAfterRouteUpdate')

  return {
    onBeforeRouteLeave,
    onBeforeRouteUpdate,
    onAfterRouteLeave,
    onAfterRouteUpdate,
  }
}
