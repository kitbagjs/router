import { expectTypeOf, test } from 'vitest'
import { createParam } from '@/services/createParam'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { withParams } from '@/services/withParams'
import { ResolvedRoute } from '@/types/resolved'

test('lookup preserves the param value type on wide resolved and live routes', () => {
  const userId = createParam(Number)
  const route = createRoute({ name: 'user', path: withParams('/users/[id]', { id: userId }) })
  const router = createRouter([route])
  const resolved: ResolvedRoute = router.resolve('user', { id: 1 })

  expectTypeOf(resolved.getParam(userId)).toEqualTypeOf<number | undefined>()
  expectTypeOf(resolved.getAllParams(userId)).toEqualTypeOf<number[]>()
  expectTypeOf(router.route.getParam(userId)).toEqualTypeOf<number | undefined>()
})

test('lookup requires a created param definition', () => {
  const route = createRoute({ name: 'home', path: '/' })
  const resolved = createRouter([route]).resolve('home')

  // @ts-expect-error lookup requires a created definition with an identity
  resolved.getParam(Number)
  // @ts-expect-error collection lookup also requires a definition with an identity
  resolved.getAllParams(Number)
})
