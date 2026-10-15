import { createRouterAssets } from '@kitbag/router'
import { router } from './router'

export const { RouterLink, RouterView, useRoute } = createRouterAssets(router)
