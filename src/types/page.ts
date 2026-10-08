import { CallbackContextAbort, CallbackContextPush, CallbackContextRedirect, CallbackContextReject, CallbackContextSuccess } from '@/types/callbackContext'
import { ComponentWithAsyncLoader } from '@/utilities/components'
import { Component } from 'vue'
import { ValueComputation } from '@/services/createRouteValueStore'
import { Rejection } from '@/types/rejection'
import { ResolvedRoute } from '@/types/resolved'
import { RejectContext } from '@/types/routerReject'
import { MaybePromise } from '@/types/utilities'
import { NavigationProgressTracker } from '@/services/createNavigationProgress'

export type PageSource = { kind: 'route', route: ResolvedRoute } | { kind: 'rejection', rejection: Rejection, context: RejectContext }

export type PageView = {
  /** Omitted depth or name matches every outlet, as rejection views do. */
  depth?: number,
  name?: string,
  component: Component,
}

export type PageHookResponse = CallbackContextSuccess | CallbackContextPush | CallbackContextRedirect | CallbackContextReject | CallbackContextAbort

export type PageHook = () => MaybePromise<void>

export type PageHooks = {
  redirects: PageHook[],
  beforeEnter: PageHook[],
  beforeUpdate: PageHook[],
  beforeLeave: PageHook[],
  afterEnter: PageHook[],
  afterUpdate: PageHook[],
  afterLeave: PageHook[],
}

export type PageNavigation = {
  to: Page,
  from: Page | null,
  signal: AbortSignal,
}

export type BeforePageNavigation = PageNavigation & {
  progress: NavigationProgressTracker,
}

/** A resolved destination. URL matching and public callback types belong to its source. */
export type Page = {
  source: PageSource,
  views: PageView[],
  computations: ValueComputation[],
  asyncComponents: ComponentWithAsyncLoader[],
  getHooks: (navigation: PageNavigation) => PageHooks,
  getTitle: () => Promise<string | undefined>,
  status: number,
}

export function getPageRoute(page: Page | null): ResolvedRoute | null {
  if (page?.source.kind === 'route') {
    return page.source.route
  }

  return null
}
