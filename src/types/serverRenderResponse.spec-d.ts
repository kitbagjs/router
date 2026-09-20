import { expectTypeOf, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { createRejection } from '@/services/createRejection'
import { component } from '@/utilities/testHelpers'

test('a reject carries the rejection as a plain string, the status is what a server acts on', async () => {
  const unauthorized = createRejection({ type: 'Unauthorized', status: 401 })
  const route = createRoute({ name: 'route', path: '/', component })
  const router = createRouter([route], { ssr: true, initialUrl: '/', rejections: [unauthorized] })

  const response = await router.render()

  if (response.kind === 'reject') {
    expectTypeOf(response.rejection).toEqualTypeOf<string>()
    expectTypeOf(response.status).toEqualTypeOf<number>()
  }
})

test('kind narrows a redirect to its location and status', async () => {
  const route = createRoute({ name: 'route', path: '/', component })
  const router = createRouter([route], { ssr: true, initialUrl: '/' })

  const response = await router.render()

  if (response.kind === 'redirect') {
    expectTypeOf(response.location).toEqualTypeOf<string>()
    expectTypeOf(response.status).toEqualTypeOf<301 | 302>()
  } else {
    expectTypeOf(response.status).toEqualTypeOf<number>()
  }
})
