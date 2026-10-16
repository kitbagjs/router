import { expectTypeOf, test } from 'vitest'
import { createHook } from '@/services/createHook'
import { createRoute } from '@/services/createRoute'
import { createRejection } from '@/services/createRejection'
import { createRouter } from '@/services/createRouter'
import { createRouterAssets } from '@/services/createRouterAssets'
import { ResolvedRoute } from '@/types/resolved'

test('declared context types helpers and the hook attaches to compatible lifecycles', () => {
  const login = createRoute({ name: 'login', path: '/login' })
  const denied = createRejection({ type: 'Denied' })
  const hook = createHook({
    context: [login, denied],
    hook: (route, context) => {
      const { from, push, reject, signal } = context
      expectTypeOf(route).toEqualTypeOf<ResolvedRoute | null>()
      expectTypeOf(from).toEqualTypeOf<ResolvedRoute | null>()
      expectTypeOf(signal).toEqualTypeOf<AbortSignal>()
      // @ts-expect-error abort requires narrowing to a before invocation
      context.abort()
      if (context.lifecycle === 'before') {
        expectTypeOf(context.abort).toEqualTypeOf<() => void>()
      } else {
        // @ts-expect-error after hooks cannot abort
        context.abort()
      }
      push('login')
      reject('Denied')
      // @ts-expect-error only declared named targets are known
      push('user')
      // @ts-expect-error only declared and built-in rejections are known
      reject('Other')
    },
  })
  const user = createRoute({ name: 'user', path: '/users/[id]' })
  user.onBeforeRouteEnter(hook)
  user.onBeforeRouteUpdate(hook)
  user.onBeforeRouteLeave(hook)
  user.onAfterRouteEnter(hook)
  user.onAfterRouteUpdate(hook)
  user.onAfterRouteLeave(hook)
})

test('router assets type both routes in a reusable hook callback', () => {
  const user = createRoute({ name: 'user', path: '/users/[id]' })
  const login = createRoute({ name: 'login', path: '/login' })
  const assets = createRouterAssets(createRouter([user]))
  const hook = assets.createHook({
    context: [login],
    hook: (route, { from, push }) => {
      expectTypeOf(route?.params.id).toEqualTypeOf<string | undefined>()
      expectTypeOf(from?.name).toEqualTypeOf<'user' | undefined>()
      push('login')
      // @ts-expect-error the router does not expand the hook's declared context
      push('user')
    },
  })

  user.onAfterRouteEnter(hook)
})
