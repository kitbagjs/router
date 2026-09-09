import { expectTypeOf, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { createRejection } from '@/services/createRejection'
import { component } from '@/utilities/testHelpers'

test('rejection is the router\'s rejection types, not string', async () => {
  const unauthorized = createRejection({ type: 'Unauthorized', status: 401 })
  const route = createRoute({ name: 'route', path: '/', component })
  const router = createRouter([route], { initialUrl: '/', rejections: [unauthorized] })

  const outcome = await router.render()

  expectTypeOf(outcome.rejection).toEqualTypeOf<'Unauthorized' | 'NotFound' | null>()
})

test('location narrows the status to a redirect', async () => {
  const route = createRoute({ name: 'route', path: '/', component })
  const router = createRouter([route], { initialUrl: '/' })

  const outcome = await router.render()

  if (outcome.location !== undefined) {
    expectTypeOf(outcome.location).toEqualTypeOf<string>()
    expectTypeOf(outcome.status).toEqualTypeOf<301 | 302>()
  } else {
    expectTypeOf(outcome.status).toEqualTypeOf<number>()
  }
})
