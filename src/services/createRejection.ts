import { createRejectionHooks } from '@/services/createRejectionHooks'
import { genericRejection } from '@/components/rejection'
import { RejectionHooks } from '@/types/hooks'
import { IS_REJECTION_SYMBOL, Rejection, RejectionInternal, RejectionOptions } from '@/types/rejection'
import { markRaw } from 'vue'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { GetTitleCallback, RouteSetTitle } from '@/types/routeTitle'

export function createRejection<TType extends string>(options: RejectionOptions<TType>): Rejection<TType> & RejectionHooks<TType> & RouteSetTitle

export function createRejection({ type, component, status }: RejectionOptions): Rejection {
  const { store, ...hooks } = createRejectionHooks()

  const route = createRoute({
    name: type,
  }).addView(markRaw(component ?? genericRejection(type)))

  const { setTitle } = route

  const getTitle: GetTitleCallback = (from) => createResolvedRoute(route).getTitle(from)

  const internal = {
    [IS_REJECTION_SYMBOL]: true,
    route,
    hooks: [store],
  } satisfies RejectionInternal

  const rejection = {
    type,
    status,
    setTitle,
    getTitle,
    ...hooks,
    ...internal,
  } satisfies Rejection & RejectionInternal & RejectionHooks & RouteSetTitle

  return rejection
}
