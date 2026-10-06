import { Page } from '@/types/page'
import { ResolvedRoute } from '@/types/resolved'
import { Rejection, RejectionInternal } from '@/types/rejection'
import { ComponentsStore } from '@/services/createComponentsStore'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { GetTitleCallback } from '@/types/routeTitle'
import { reactive } from 'vue'
import { DetachedStore, RouteValueResponses, RouteValueStore } from '@/services/createRouteValueStore'

export function createRoutePage(route: ResolvedRoute, components: ComponentsStore, values: RouteValueStore | null): Page {
  let prepared: DetachedStore | undefined

  return {
    id: route.id,
    assets: route,
    route,
    rejection: null,
    status: 200,
    getComponent: (depth, name) => {
      const match = route.matches.at(depth)

      return match ? components.getRouteComponents(match.id, match.views)[name] ?? null : null
    },
    getTitle: route.getTitle,
    prepareValues: () => {
      if (!values) {
        return emptyValues()
      }

      prepared ??= values.claimStaged()

      return prepared.compute(route)
    },
    commitValues: () => {
      prepared?.stage()
      prepared = undefined

      return values?.commit(route) ?? emptyValues()
    },
    disposeValues: () => {
      prepared?.dispose()
      prepared = undefined
    },
  }
}

export function createRejectionPage(rejection: Rejection & RejectionInternal, fallbackTitle: GetTitleCallback, rejectStatus: number): Page {
  const assets = createResolvedRoute(rejection.route)
  const component = assets.matches.at(0)?.views.default.component ?? null

  return {
    id: assets.id,
    assets,
    route: null,
    rejection: reactive(rejection),
    status: rejection.status ?? rejectStatus,
    // Rejections replace every outlet, including named and nested outlets.
    getComponent: () => component,
    getTitle: async () => await rejection.getTitle() ?? fallbackTitle(),
    // Retain the public route's data while a rejection is displayed. Rejections have no getters.
    prepareValues: emptyValues,
    commitValues: emptyValues,
    disposeValues: () => {},
  }
}

function emptyValues(): RouteValueResponses {
  return {
    props: Promise.resolve({ status: 'SUCCESS' }),
    loaders: Promise.resolve({ status: 'SUCCESS' }),
    values: [],
  }
}
