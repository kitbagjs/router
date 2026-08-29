import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { RenderInBrowserError } from '@/errors/renderInBrowserError'
import { component } from '@/utilities/testHelpers'

test('throws in the browser, where the response it reports would be meaningless', async () => {
  const route = createRoute({ name: 'route', path: '/', component })
  const router = createRouter([route], { initialUrl: '/' })

  await router.start()

  await expect(router.render()).rejects.toThrow(RenderInBrowserError)
})
