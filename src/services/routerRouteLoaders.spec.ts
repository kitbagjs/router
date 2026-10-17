import { expect, test } from 'vitest'
import { toRaw } from 'vue'
import { createLoader } from '@/services/createLoader'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'
import { isLoader } from '@/types/loader'
import { isSameLoader } from '@/services/isSameLoader'

test('route.loaders exposes inline, reusable, and inherited definitions', async () => {
  const reusable = createLoader({ load: () => 'user' })
  const parent = createRoute({ name: 'parent', path: '/' }).addLoader(async () => 42)
  const child = createRoute({ parent, name: 'child', path: '/child' })
    .addLoader(reusable, { name: 'user' })
  const router = createRouter([child], { initialUrl: '/child' })
  await router.start()

  expect(isLoader(router.route.loaders.default)).toBe(true)
  expect(toRaw(router.route.loaders.default)).toBe(parent.matches[0].loaders.default)
  expect(toRaw(router.route.loaders.user)).toBe(child.matches[1].loaders.user)
  expect(isSameLoader(router.route.loaders.user, reusable)).toBe(true)
  expect(router.route.loaders.user.load).toBe(reusable.load)
  expect('data' in router.route.loaders.user).toBe(false)
  await expect(router.route.data.default).resolves.toBe(42)
  router.stop()
})
