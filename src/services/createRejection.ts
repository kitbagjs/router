import { genericRejection } from '@/components/rejection'
import { IS_REJECTION_SYMBOL, Rejection, RejectionInternal, RejectionOptions, RejectionWithMethods } from '@/types/rejection'
import { markRaw } from 'vue'
import { createRouteDefinition } from '@/services/createRoute'
import { withRouteMethods } from '@/services/withRouteMethods'
import { Route } from '@/types/route'
import { addViewToMatch, toView } from '@/services/addView'

export function createRejection<const TOptions extends RejectionOptions>(options: TOptions): RejectionWithMethods<TOptions>

export function createRejection(options: RejectionOptions): Route {
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- Support the legacy component option.
  const { component } = options
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- Support the legacy option.
  const name = 'name' in options ? options.name : options.type
  const { route, hooks } = createRouteDefinition({ ...options, name })
  const view = toView(markRaw(component ?? genericRejection(name)), undefined)

  const rejection: Rejection & RejectionInternal = {
    ...route,
    [IS_REJECTION_SYMBOL]: true,
    kind: 'rejection',
    type: name,
    status: options.status,
    matches: route.matches.map((match) => ({ ...addViewToMatch(match, view), kind: 'rejection' })),
  }

  return withRouteMethods(rejection, hooks)
}
