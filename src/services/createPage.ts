import { Page } from '@/types/page'
import { ResolvedRoute } from '@/types/resolved'
import { Rejection, RejectionInternal } from '@/types/rejection'
import { ComponentsStore } from '@/services/createComponentsStore'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { GetTitleCallback } from '@/types/routeTitle'
import { reactive } from 'vue'

export function createRoutePage(route: ResolvedRoute, components: ComponentsStore): Page {
  return {
    assets: route,
    rejection: null,
    status: 200,
    getComponent: (depth, name) => {
      const match = route.matches.at(depth)

      if (!match) {
        return null
      }

      return components.getRouteComponents(match.id, match.views)[name] ?? null
    },
    getTitle: route.getTitle,
  }
}

export function createRejectionPage(rejection: Rejection & RejectionInternal, fallbackTitle: GetTitleCallback, rejectStatus: number): Page {
  const assets = createResolvedRoute(rejection.route)
  const component = assets.matches.at(0)?.views.default.component ?? null

  return {
    assets,
    rejection: reactive(rejection),
    status: rejection.status ?? rejectStatus,
    // Rejections replace every outlet, including named and nested outlets.
    getComponent: () => component,
    getTitle: async () => await rejection.getTitle() ?? fallbackTitle(),
  }
}
