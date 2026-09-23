import { test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { createRouterAssets } from '@/services/createRouterAssets'
import { ResolvedRoute } from '@/types/resolved'

const router = createRouter([
  createRoute({ name: 'route', path: '/route' }),
])

const { useLink } = createRouterAssets(router)

test('accepts a route name, url string, or resolved route', () => {
  useLink('route')
  useLink('/route')
  useLink(() => router.resolve('route'))
})

test('does not accept an undefined source', () => {
  // @ts-expect-error - source is required
  useLink(undefined)

  // @ts-expect-error - source cannot resolve to undefined
  useLink((): ResolvedRoute | undefined => undefined)
})
