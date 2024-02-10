import { isInternalRoute } from '@/types/internal'
import { Route } from '@/types/routes'

export const NotFoundRejectionKey = Symbol('NotFoundRejectionKey')

export function isNotFoundRejectionRoute(route: Route): boolean {
  return isInternalRoute(route) && route._internal.key === NotFoundRejectionKey
}