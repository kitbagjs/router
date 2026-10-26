import { RouterResolveOptions } from '@/types/routerResolve'

export function hasRouteChanges(options: RouterResolveOptions = {}): boolean {
  return options.query !== undefined || options.hash !== undefined || options.state !== undefined
}
