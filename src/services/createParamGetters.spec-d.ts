import { expectTypeOf, test } from 'vitest'
import { createParam } from '@/services/createParam'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { withParams } from '@/services/withParams'
import { ResolvedRoute } from '@/types/resolved'
import { createParam as createPublicParam, withDefault, isParam, Param } from '@/main'

test('public param factories and guard keep identity metadata internal', () => {
  const param = createPublicParam(Number)
  const defaulted = withDefault(param, 1)
  const createdWithDefault = createPublicParam(Number, 1)

  expectTypeOf<keyof typeof param>().toEqualTypeOf<keyof Param<number>>()
  expectTypeOf<Extract<keyof typeof defaulted, symbol>>().toEqualTypeOf<never>()
  expectTypeOf(createdWithDefault).toEqualTypeOf<typeof defaulted>()

  const value: unknown = param

  if (isParam(value)) {
    expectTypeOf(value).toEqualTypeOf<Param>()
  }
})

test('lookup preserves the param value type on wide resolved and current routes', () => {
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
