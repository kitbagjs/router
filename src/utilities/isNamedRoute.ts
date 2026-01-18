import { Route } from '@/types/route'
import { stringHasValue } from '@/utilities/guards'

export function isNamedRoute(route: Route): route is Route & { name: string } {
  return 'name' in route && stringHasValue(route.name)
}
