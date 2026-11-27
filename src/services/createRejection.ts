import { createRejectionHooks } from '@/services/createRejectionHooks'
import { genericRejection } from '@/components/rejection'
import { RejectionHooks } from '@/types/hooks'
import { IS_REJECTION_SYMBOL, Rejection, RejectionInternal, RejectionOptions } from '@/types/rejection'
import { markRaw } from 'vue'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { RouteSetTitle } from '@/types/routeTitle'

export function createRejection<TType extends string>(options: RejectionOptions<TType>): Rejection<TType> & RejectionHooks<TType> & RouteSetTitle

export function createRejection(options: RejectionOptions): Rejection {
  const { component, status } = options
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- Support the legacy option.
  const name = 'name' in options ? options.name : options.type
  const { store, ...hooks } = createRejectionHooks()

  const route = createRoute({
    name,
  }).addView(markRaw(component ?? genericRejection(name)))

  const { setTitle } = route

  const getTitle = (): Promise<string | undefined> => createResolvedRoute(route).getTitle()

  const internal = {
    [IS_REJECTION_SYMBOL]: true,
    route,
    hooks: [store],
  } satisfies RejectionInternal

  const rejection = {
    name,
    type: name,
    status,
    setTitle,
    getTitle,
    ...hooks,
    ...internal,
  } satisfies Rejection & RejectionInternal & RejectionHooks & RouteSetTitle

  return rejection
}
