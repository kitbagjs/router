import { Page, PageSource, PageView } from '@/types/page'
import { ResolvedRoute } from '@/types/resolved'
import { Rejection, RejectionInternal } from '@/types/rejection'
import { RejectContext } from '@/types/routerReject'
import { RedirectStatus } from '@/types/router'
import { ComponentsStore } from '@/services/createComponentsStore'
import { RouteValueStore } from '@/services/createRouteValueStore'
import { getAsyncComponents, isAsyncComponent } from '@/utilities/components'
import { getRejectionPageHooks, getRoutePageHooks } from '@/services/getPageHooks'

type RoutePageOptions = {
  components: ComponentsStore,
  values: RouteValueStore,
  redirectStatus: RedirectStatus,
  ssr?: boolean,
}

export function createRoutePage(route: ResolvedRoute, options: RoutePageOptions): Page {
  const source = { kind: 'route', route } satisfies PageSource
  const views = route.matches.flatMap((match, depth) => {
    const components = options.components.getRouteComponents(match.id, match.views)

    return Object.entries(components).map(([name, component]) => ({ depth, name, component }))
  })

  return {
    source,
    views,
    computations: options.values.getComputations(route),
    asyncComponents: getAsyncComponents(route),
    getHooks: (navigation) => getRoutePageHooks(source.route, navigation, options.redirectStatus, options.ssr),
    getTitle: route.getTitle,
    status: 200,
  }
}

export function createRejectionPage(rejection: Rejection & RejectionInternal, context: RejectContext, status: number): Page {
  const component = rejection.route.matches[0].views.default.component
  const views: PageView[] = []
  const asyncComponents: Page['asyncComponents'] = []

  if (component) {
    views.push({ component })

    if (isAsyncComponent(component)) {
      asyncComponents.push(component)
    }
  }

  return {
    source: { kind: 'rejection', rejection, context },
    views,
    computations: [],
    asyncComponents,
    getHooks: () => getRejectionPageHooks(rejection, context),
    getTitle: rejection.getTitle,
    status: rejection.status ?? status,
  }
}
