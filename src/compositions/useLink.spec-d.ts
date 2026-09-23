import { test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { createRouterAssets } from '@/services/createRouterAssets'
import { ResolvedRoute } from '@/types/resolved'
import { UrlString } from '@/types/urlString'

const router = createRouter([
  createRoute({ name: 'route', path: '/route' }),
  createRoute({ name: 'withParams', path: '/with-params/[id]' }),
])

const { useLink } = createRouterAssets(router)

test('accepts a route name, url string, or resolved route', () => {
  useLink('route')
  useLink('withParams', { id: 'abc' })
  useLink('/route')
  useLink(() => router.resolve('route'))
  useLink((): UrlString | ResolvedRoute => router.resolve('route'))
})

test('does not accept an unknown route name or missing params', () => {
  // @ts-expect-error - unknown route name
  useLink('nope')

  // @ts-expect-error - missing params
  useLink('withParams')
})

test('does not accept an undefined source', () => {
  // @ts-expect-error - source is required
  useLink(undefined)

  // @ts-expect-error - source cannot resolve to undefined
  useLink((): ResolvedRoute | undefined => undefined)
})
