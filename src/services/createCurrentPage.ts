import { computed, InjectionKey, ShallowRef, shallowRef } from 'vue'
import { createCurrentRoute } from '@/services/createCurrentRoute'
import { createRouterKeyStore } from '@/services/createRouterKeyStore'
import { Page } from '@/types/page'
import { Router } from '@/types/router'
import { Routes } from '@/types/route'
import { RouterPush } from '@/types/routerPush'
import { RouterRejectInternal } from '@/types/routerReject'
import { ResolvedRoute } from '@/types/resolved'
import { RouteValueStore } from '@/services/createRouteValueStore'

export const getCurrentPageKey = createRouterKeyStore<ShallowRef<Page | null>>()

type CurrentPageOptions = {
  routerKey: InjectionKey<Router>,
  fallbackRoute: ResolvedRoute,
  push: RouterPush,
  values: RouteValueStore,
  reject: RouterRejectInternal<undefined>,
}

// Public route/rejection state is projected here. Navigation and outlets only consume the page.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function createCurrentPage<TRoutes extends Routes>({ routerKey, fallbackRoute, push, values, reject }: CurrentPageOptions) {
  const { routerRoute, currentRoute, updateRoute } = createCurrentRoute<TRoutes>({ routerKey, fallbackRoute, push, getData: values.getData })
  const currentPage = shallowRef<Page | null>(null)

  function updatePage(page: Page): void {
    if (page.source.kind === 'route') {
      page.source.route = updateRoute(page.source.route)
    }

    currentPage.value = page
  }

  const currentRejection = computed({
    get() {
      const source = currentPage.value?.source

      if (source?.kind === 'rejection') {
        return source.rejection
      }

      return null
    },
    set(rejection) {
      if (rejection) {
        void reject(rejection.type)
        return
      }

      void push(currentRoute, { replace: true })
    },
  })

  async function getTitle(): Promise<string | undefined> {
    const page = currentPage.value

    if (!page) {
      return currentRoute.getTitle()
    }

    const title = await page.getTitle()

    if (page.source.kind === 'rejection' && title === undefined) {
      return currentRoute.getTitle()
    }

    return title
  }

  return { currentPage, routerRoute, currentRejection, updatePage, getTitle }
}
