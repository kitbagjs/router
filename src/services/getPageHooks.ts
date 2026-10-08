import { getAfterHooksFromRoutes, getBeforeHooksFromRoutes } from '@/services/getRouteHooks'
import { getGlobalAfterHooks, getGlobalBeforeHooks } from '@/services/getGlobalRouteHooks'
import { createRouterCallbackContext } from '@/services/createRouterCallbackContext'
import { getPageRoute, PageHook, PageHooks, PageNavigation } from '@/types/page'
import { ResolvedRoute } from '@/types/resolved'
import { RejectContext } from '@/types/routerReject'
import { Rejection, RejectionInternal } from '@/types/rejection'
import { Hooks } from '@/models/hooks'
import { RedirectStatus } from '@/types/router'
import { MaybePromise } from '@/types/utilities'

export function emptyPageHooks(): PageHooks {
  return { redirects: [], beforeEnter: [], beforeUpdate: [], beforeLeave: [], afterEnter: [], afterUpdate: [], afterLeave: [] }
}

// A route callback's arguments are guaranteed by lifecycle selection. The adapter is the only place
// that erases those public types; the runner receives callbacks with no arguments.
type RouteCallback = (to: ResolvedRoute, context: any) => MaybePromise<void>

export function bindRouteHooks(callbacks: Iterable<RouteCallback>, navigation: PageNavigation, redirectStatus: RedirectStatus): PageHook[] {
  const to = getPageRoute(navigation.to)
  const from = getPageRoute(navigation.from)
  const context = { ...createRouterCallbackContext({ to }), from, signal: navigation.signal, redirectStatus }

  return Array.from(callbacks, (callback) => {
    const invoke = callback as (to: ResolvedRoute | null, hookContext: typeof context) => MaybePromise<void>

    return () => invoke(to, context)
  })
}

export function getRoutePageHooks(route: ResolvedRoute, navigation: PageNavigation, redirectStatus: RedirectStatus, ssr = false): PageHooks {
  const hooks = emptyPageHooks()
  const to = getPageRoute(navigation.to)
  const from = getPageRoute(navigation.from)
  const before = getBeforeHooksFromRoutes(to, from)
  const after = getAfterHooksFromRoutes(to, from)
  const bind = (callbacks: Iterable<RouteCallback>): PageHook[] => bindRouteHooks(callbacks, navigation, redirectStatus)

  if (to === route) {
    hooks.redirects = bind(before.redirects)
    hooks.beforeEnter = bind(before.onBeforeRouteEnter)
    hooks.beforeUpdate = bind(before.onBeforeRouteUpdate)

    if (!ssr) {
      hooks.afterEnter = bind(after.onAfterRouteEnter)
      hooks.afterUpdate = bind(after.onAfterRouteUpdate)
    }
  }

  if (from === route) {
    hooks.beforeLeave = bind(before.onBeforeRouteLeave)

    if (!ssr) {
      hooks.afterLeave = bind(after.onAfterRouteLeave)
    }
  }

  return hooks
}

export function getRejectionPageHooks(rejection: Rejection & RejectionInternal, { to = null, from = null }: RejectContext): PageHooks {
  const hooks = emptyPageHooks()
  const context = { to, from }

  hooks.afterEnter = rejection.hooks.flatMap((store) => Array.from(store.onRejection, (hook) => () => hook(rejection.type, context)))

  return hooks
}

export function getGlobalPageHooks(navigation: PageNavigation, store: Hooks, redirectStatus: RedirectStatus, ssr = false): PageHooks {
  const to = getPageRoute(navigation.to)
  const from = getPageRoute(navigation.from)
  const before = getGlobalBeforeHooks(to, from, store)
  const after = getGlobalAfterHooks(to, from, store)
  const bind = (callbacks: Iterable<RouteCallback>): PageHook[] => bindRouteHooks(callbacks, navigation, redirectStatus)
  const hooks: PageHooks = {
    redirects: [],
    beforeEnter: bind(before.onBeforeRouteEnter),
    beforeUpdate: bind(before.onBeforeRouteUpdate),
    beforeLeave: bind(before.onBeforeRouteLeave),
    afterEnter: [],
    afterUpdate: [],
    afterLeave: [],
  }

  if (!ssr) {
    hooks.afterEnter = bind(after.onAfterRouteEnter)
    hooks.afterUpdate = bind(after.onAfterRouteUpdate)
    hooks.afterLeave = bind(after.onAfterRouteLeave)
  }

  const { source } = navigation.to

  if (source.kind === 'rejection') {
    const context = { to: source.context.to ?? null, from: source.context.from ?? null }

    hooks.afterEnter.push(...Array.from(store.onRejection, (hook) => () => hook(source.rejection.type, context)))
  }

  return hooks
}
