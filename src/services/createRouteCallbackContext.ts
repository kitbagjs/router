import { createRouterCallbackContext } from '@/services/createRouterCallbackContext'
import { getCallbackParent } from '@/services/getCallbackParent'
import { ComputationContext } from '@/types/computation'
import { PropsCallbackParent } from '@/types/props'
import { Routes } from '@/types/route'
import { Rejections } from '@/types/rejection'
import { RouterPush } from '@/types/routerPush'
import { RouterReject } from '@/types/routerReject'
import { RouterReplace } from '@/types/routerReplace'
import { RouteUpdate } from '@/types/routeUpdate'

type RouteCallbackContext = {
  push: RouterPush,
  replace: RouterReplace<Routes>,
  reject: RouterReject<Rejections>,
  update: RouteUpdate,
  signal: AbortSignal,
  parent: PropsCallbackParent,
}

export function createRouteCallbackContext(depth: number, context: ComputationContext): RouteCallbackContext {
  const { to, signal } = context
  const { push, replace, reject, update } = createRouterCallbackContext({ to })
  const parent = getCallbackParent(depth, context)

  return { push, replace, reject, update, signal, parent }
}
