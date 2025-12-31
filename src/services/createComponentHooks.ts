import { InjectionKey, onUnmounted } from 'vue'
import { createUseRouterDepth } from '@/compositions/useRouterDepth'
import { createUseRouterHooks } from '@/compositions/useRouterHooks'
import { AddBeforeEnterHook, AddBeforeUpdateHook, AddBeforeLeaveHook, AddAfterEnterHook, AddAfterUpdateHook, AddAfterLeaveHook, AfterHookLifecycle, BeforeHookLifecycle, AfterEnterHook, AfterUpdateHook, AfterLeaveHook, BeforeEnterHook, BeforeUpdateHook, BeforeLeaveHook } from '@/types/hooks'
import { Routes } from '@/types/route'
import { Router, RouterRejections, RouterRoutes } from '@/types/router'
import { Rejections } from '@/types/rejection'

function createComponentBeforeHook<TRouter extends Router>(routerKey: InjectionKey<TRouter>, lifecycle: 'onBeforeRouteEnter'): AddBeforeEnterHook<RouterRoutes<TRouter>[number], RouterRoutes<TRouter>[number], RouterRoutes<TRouter>, RouterRejections<TRouter>>
function createComponentBeforeHook<TRouter extends Router>(routerKey: InjectionKey<TRouter>, lifecycle: 'onBeforeRouteUpdate'): AddBeforeUpdateHook<RouterRoutes<TRouter>[number], RouterRoutes<TRouter>[number], RouterRoutes<TRouter>, RouterRejections<TRouter>>
function createComponentBeforeHook<TRouter extends Router>(routerKey: InjectionKey<TRouter>, lifecycle: 'onBeforeRouteLeave'): AddBeforeLeaveHook<RouterRoutes<TRouter>[number], RouterRoutes<TRouter>[number], RouterRoutes<TRouter>, RouterRejections<TRouter>>
function createComponentBeforeHook(routerKey: symbol, lifecycle: BeforeHookLifecycle): AddBeforeEnterHook | AddBeforeUpdateHook | AddBeforeLeaveHook {
  const useRouterDepth = createUseRouterDepth(routerKey)
  const useRouterHooks = createUseRouterHooks(routerKey)

  return (hook: BeforeEnterHook | BeforeUpdateHook | BeforeLeaveHook) => {
    const depth = useRouterDepth()
    const hooks = useRouterHooks()

    const remove = hooks.addComponentHook({ lifecycle, hook, depth: depth - 1 })

    onUnmounted(remove)

    return remove
  }
}

function createComponentAfterHook<TRouter extends Router>(routerKey: InjectionKey<TRouter>, lifecycle: 'onAfterRouteEnter'): AddAfterEnterHook<RouterRoutes<TRouter>[number], RouterRoutes<TRouter>[number], RouterRoutes<TRouter>, RouterRejections<TRouter>>
function createComponentAfterHook<TRouter extends Router>(routerKey: InjectionKey<TRouter>, lifecycle: 'onAfterRouteUpdate'): AddAfterUpdateHook<RouterRoutes<TRouter>[number], RouterRoutes<TRouter>[number], RouterRoutes<TRouter>, RouterRejections<TRouter>>
function createComponentAfterHook<TRouter extends Router>(routerKey: InjectionKey<TRouter>, lifecycle: 'onAfterRouteLeave'): AddAfterLeaveHook<RouterRoutes<TRouter>[number], RouterRoutes<TRouter>[number], RouterRoutes<TRouter>, RouterRejections<TRouter>>
function createComponentAfterHook(routerKey: symbol, lifecycle: AfterHookLifecycle): AddAfterEnterHook | AddAfterUpdateHook | AddAfterLeaveHook {
  const useRouterDepth = createUseRouterDepth(routerKey)
  const useRouterHooks = createUseRouterHooks(routerKey)

  return (hook: AfterEnterHook | AfterUpdateHook | AfterLeaveHook) => {
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
  onBeforeRouteLeave: AddBeforeLeaveHook<TRoutes[number], TRoutes[number], TRoutes, TRejections>,
  onBeforeRouteUpdate: AddBeforeUpdateHook<TRoutes[number], TRoutes[number], TRoutes, TRejections>,
  onAfterRouteLeave: AddAfterLeaveHook<TRoutes[number], TRoutes[number], TRoutes, TRejections>,
  onAfterRouteUpdate: AddAfterUpdateHook<TRoutes[number], TRoutes[number], TRoutes, TRejections>,
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
