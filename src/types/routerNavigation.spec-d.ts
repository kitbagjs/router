import { expectTypeOf, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { withParams } from '@/services/withParams'
import { ContextRoutes } from '@/types/routeContext'
import { RouterPush } from '@/types/routerPush'
import { RouterReplace } from '@/types/routerReplace'

test('navigation targets do not require context metadata', () => {
  const user = createRoute({
    name: 'user',
    path: withParams('/users/[id]', { id: Number }),
    state: { draft: Boolean },
  })
  const router = createRouter([user])
  type Definition = Omit<typeof user, 'context'>
  type Context = ContextRoutes<readonly [Definition]>

  expectTypeOf<Context[number]>().not.toHaveProperty('context')

  const push: RouterPush<Context> = router.push
  const replace: RouterReplace<Context> = router.replace

  for (const navigate of [push, replace]) {
    navigate('user', { id: 1 })
    navigate('user', { id: 1 }, { state: { draft: true } })
    // @ts-expect-error route names remain checked
    navigate('missing')
    // @ts-expect-error required params remain required
    navigate('user')
    // @ts-expect-error param types are preserved
    navigate('user', { id: '1' })
    // @ts-expect-error state types are preserved
    navigate('user', { id: 1 }, { state: { draft: 'yes' } })
  }
})
