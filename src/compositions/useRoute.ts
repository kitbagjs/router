import { ExtractRouteMethodParams, RouteMethod } from '@/types/routeMethods'
import { Identity } from '@/types/utilities'

type Route<T extends RouteMethod> = {
  name: string,
  params: ExtractRouteMethodParams<T>,
  query: unknown,
  hash: string,
}

export function useRoute<T extends RouteMethod>(): Identity<Route<T>> {
  throw 'not implemented'
}