import { expect, test } from 'vitest'
import { createRoute } from '@/services/createRoute'
import { createRouter } from '@/services/createRouter'

test('inherited handles follow navigation without being replaced', async () => {
  const parent = createRoute({ name: 'user', path: '/users/[id]' })
    .addLoader((route) => route.params.id, { name: 'user' })
  const child = createRoute({ parent, name: 'details', path: '/details' })
  const other = createRoute({ name: 'other', path: '/other' })
  const router = createRouter([parent, child, other], { initialUrl: '/users/1' })
  await router.start()
  const handles = router.route.loaders
  if (!('user' in handles)) throw new Error('Expected user loader')
  const handle = handles.user

  await expect(handle.data).resolves.toBe('1')
  await router.push('/users/2/details')
  expect('user' in router.route.loaders && router.route.loaders.user).toBe(handle)
  await expect(handle.data).resolves.toBe('2')
  expect(Object.keys(router.route.loaders)).toEqual(['user'])

  await router.push('/other')
  expect(() => handle.data).toThrow('not attached')
  router.stop()
})

test('unnamed loaders have a default handle without changing route.data', async () => {
  const route = createRoute({ name: 'home', path: '/' }).addLoader(() => 42)
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()

  expect(router.route.loaders.default.data).toBe(router.route.data)
  await expect(router.route.loaders.default.data).resolves.toBe(42)
  router.stop()
})
