import { Router } from '@/types/router'
import { isRouter } from '@/types/routerInternal'
import { isHydrating } from '@/utilities/isHydrating'

/**
 * Hydrates the router when the current component is hydrating server rendered markup, so the initial
 * route is committed before anything renders from it. Every router aware component and composable gets
 * the router through `useRouter`, which calls this.
 */
export function useHydrationDetection(router: Router): void {
  if (isRouter(router) && isHydrating()) {
    router.hydrate()
  }
}
