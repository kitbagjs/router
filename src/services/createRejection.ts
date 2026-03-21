import { createRejectionHooks } from '@/services/createRejectionHooks'
import { genericRejection } from '@/components/rejection'
import { RejectionHooks } from '@/types/hooks'
import { IS_REJECTION_SYMBOL, Rejection, RejectionInternal } from '@/types/rejection'
import { Component, markRaw } from 'vue'
import { createRoute } from '@/services/createRoute'
import { RouteSetTitle } from '@/types/routeTitle'

export function createRejection<TType extends string>(options: {
  type: TType,
  component?: Component,
}): Rejection<TType> & RejectionHooks<TType> & RouteSetTitle

export function createRejection(options: { type: string, component?: Component }): Rejection {
  const { store, ...hooks } = createRejectionHooks()

  const component = markRaw(options.component ?? genericRejection(options.type))
  const route = createRoute({
    name: options.type,
    component,
  })

  const { setTitle } = route

  const internal = {
    [IS_REJECTION_SYMBOL]: true,
    route,
    hooks: [store],
  } satisfies RejectionInternal

  const rejection = {
    type: options.type,
    component,
    setTitle,
    ...hooks,
    ...internal,
  } satisfies Rejection & RejectionInternal & RejectionHooks & RouteSetTitle

  return rejection
}
