import { createRejectionHooks } from '@/services/createRejectionHooks'
import { genericRejection } from '@/components/rejection'
import { RejectionHooks } from '@/types/hooks'
import { IS_REJECTION_SYMBOL, Rejection, RejectionInternal } from '@/types/rejection'
import { Component, markRaw } from 'vue'
import { ResolvedRoute } from '@/types/resolved'
import { createRouteId } from './createRouteId'
import { createResolvedRouteQuery } from './createResolvedRouteQuery'

export function createRejection<TType extends string>(options: {
  type: TType,
  component?: Component,
}): Rejection<TType> & RejectionHooks<TType>

export function createRejection(options: { type: string, component?: Component }): Rejection & RejectionHooks {
  const component = markRaw(options.component ?? genericRejection(options.type))
  const route = getRejectionRoute(options.type, component)

  const { store, ...hooks } = createRejectionHooks()

  const internal = {
    [IS_REJECTION_SYMBOL]: true,
    route,
    hooks: [store],
  } satisfies RejectionInternal

  const rejection = {
    type: options.type,
    component,
    ...hooks,
    ...internal,
  } satisfies Rejection & RejectionInternal & RejectionHooks

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
