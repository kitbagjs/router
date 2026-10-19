import { RouteContext } from '@/types/routeContext'

export function combineContext(parent: readonly RouteContext[] = [], child: readonly RouteContext[] = []): RouteContext[] {
  return [...new Set([...parent, ...child])]
}
