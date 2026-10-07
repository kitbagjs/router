import { genericRejection } from '@/components/rejection'
import { markRaw } from 'vue'
import { createRoute } from '@/services/createRoute'
import { RejectionMatch, RejectionOptions } from '@/types/rejection'
import { Route } from '@/types/route'
import { RouteWithMethods } from '@/types/routeWithMethods'
import { ToUrl } from '@/types/url'

export function createRejection<const TName extends string>(options: RejectionOptions<TName>): RouteWithMethods<ToUrl<{}>, [RejectionMatch<TName>]>

export function createRejection({ type, component, status }: RejectionOptions): Route {
  return createRoute({
    name: type,
    status,
    rejection: true,
    component: markRaw(component ?? genericRejection(type)),
  })
}
