import { Route } from '@/types/route'

export class InvalidRouteUrlError extends Error {
  public constructor(route: Route) {
    super(`When assembled, this route does not form valid url ${JSON.stringify(route)}`)
  }
}
