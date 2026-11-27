import { Router } from '@/types/router'
import { isRouter } from '@/types/routerInternal'
import { isHydrating } from '@/utilities/isHydrating'

/**
 * Tells the router when the current component is hydrating server rendered markup, so the initial route
 * is committed before the component renders. Called by everything that reads route state during setup.
 */
export function useHydrationDetection(router: Router): void {
  if (isRouter(router) && isHydrating()) {
    router.onHydrate()
  }
}
