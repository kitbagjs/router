import { createRejectionHooks } from '@/services/createRejectionHooks'
import { genericRejection } from '@/components/rejection'
import { RejectionHooks } from '@/types/hooks'
import { IS_REJECTION_SYMBOL, Rejection, RejectionInternal } from '@/types/rejection'
import { Component, markRaw } from 'vue'
import { ResolvedRoute } from '@/types/resolved'
import { createRouteId } from '@/services/createRouteId'
import { createResolvedRouteQuery } from '@/services/createResolvedRouteQuery'
import { createRejectionTitle, RejectionSetTitle } from '@/types/rejectionTitle'

export function createRejection<TType extends string>(options: {
  type: TType,
  component?: Component,
}): Rejection<TType> & RejectionHooks<TType> & RejectionSetTitle

export function createRejection(options: { type: string, component?: Component }): Rejection {
  const component = markRaw(options.component ?? genericRejection(options.type))
  const route = getRejectionRoute(options.type, component)

  const { store, ...hooks } = createRejectionHooks()
  const { setTitle, getTitle } = createRejectionTitle()

  const internal = {
    [IS_REJECTION_SYMBOL]: true,
    route,
    hooks: [store],
    getTitle,
  } satisfies RejectionInternal

  const rejection = {
    type: options.type,
    component,
    setTitle,
    ...hooks,
    ...internal,
  } satisfies Rejection & RejectionInternal & RejectionHooks & RejectionSetTitle

  return rejection
}

function getRejectionRoute(type: string, component: Component): ResolvedRoute {
  const route = {
    id: createRouteId(),
    component,
    meta: {},
    state: {},
  }

  const resolved = {
    id: route.id,
    matched: route,
    matches: [route],
    name: type,
    query: createResolvedRouteQuery(''),
    params: {},
    state: {},
    href: '/',
    hash: '',
    title: Promise.resolve(undefined),
  } satisfies ResolvedRoute

  return resolved
}
