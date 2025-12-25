import { describe, expectTypeOf, test } from 'vitest'
import { routes } from '@/utilities/testHelpers'
import { createRouterPlugin } from './createRouterPlugin'
import { createRejection } from './createRejection'
import { ResolvedRoute } from '@/types/resolved'
import { RouterReject } from '@/types/routerReject'
import { RouterPush } from '@/types/routerPush'
import { RouterReplace } from '@/types/routerReplace'

describe('hooks', () => {
  const NotAuthorized = createRejection({
    type: 'NotAuthorized',
  })

  const plugin = createRouterPlugin({
    routes,
    rejections: [NotAuthorized],
  })

  test('to and from should not be specifically typed', () => {
    plugin.onBeforeRouteEnter((to, { from }) => {
      expectTypeOf(to).toEqualTypeOf<ResolvedRoute>()
      expectTypeOf(from).toEqualTypeOf<ResolvedRoute | null>()
    })
  })

  test('reject should be correctly typed', () => {
    plugin.onBeforeRouteEnter((_to, { reject }) => {
      expectTypeOf(reject).toEqualTypeOf<RouterReject<[typeof NotAuthorized]>>()
    })
  })

  test('push should be correctly typed', () => {
    plugin.onBeforeRouteEnter((_to, { push }) => {
      expectTypeOf(push).toEqualTypeOf<RouterPush<typeof routes>>()
    })
  })

  test('replace should be correctly typed', () => {
    plugin.onBeforeRouteEnter((_to, { replace }) => {
      expectTypeOf(replace).toEqualTypeOf<RouterReplace<typeof routes>>()
    })
  })
})
