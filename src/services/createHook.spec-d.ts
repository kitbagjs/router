import { expectTypeOf, test } from 'vitest'
import { createHook } from '@/services/createHook'
import { createRoute } from '@/services/createRoute'
import { createRejection } from '@/services/createRejection'
import { createRouter } from '@/services/createRouter'
import { HookRoute } from '@/types/hook'
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
      if (context.kind === 'before') {
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

test('registered hook routes form a discriminated union', () => {
  const user = createRoute({ name: 'user', path: '/users/[id]' })
  const home = createRoute({ name: 'home', path: '/' })
  const router = createRouter([user, home], { initialUrl: '/' })
  type RegisteredRoute = HookRoute<{ router: typeof router }>
  expectTypeOf<Extract<RegisteredRoute, { name: 'user' }>['params']>().toEqualTypeOf<{ id: string }>()
})
