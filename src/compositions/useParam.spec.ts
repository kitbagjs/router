/* eslint-disable vue/one-component-per-file */
import { createApp, isReadonly } from 'vue'
import { expect, onTestFinished, test } from 'vitest'
import { createParam, createRoute, createRouter, useParam, withParams } from '@/main'

test('value contains the first matching param', async () => {
  const userId = createParam(Number)
  const route = createRoute({ name: 'users', path: withParams('/users/[from]/[to]', { from: userId, to: userId }) })
  const router = createRouter([route], { initialUrl: '/users/1/2' })
  const app = createApp({})
  app.use(router)
  await router.start()

  onTestFinished(() => router.stop())

  const { value } = app.runWithContext(() => useParam(userId))

  expect(value.value).toBe(1)
})

test('values contains all matching params', async () => {
  const userId = createParam(Number)
  const route = createRoute({ name: 'users', path: withParams('/users/[from]/[to]', { from: userId, to: userId }) })
  const router = createRouter([route], { initialUrl: '/users/1/2' })
  const app = createApp({})
  app.use(router)
  await router.start()

  onTestFinished(() => router.stop())

  const { values } = app.runWithContext(() => useParam(userId))

  expect(values.value).toEqual([1, 2])
})

test('destructured value follows navigation', async () => {
  const userId = createParam(Number)
  const route = createRoute({ name: 'user', path: withParams('/users/[id]', { id: userId }) })
  const router = createRouter([route], { initialUrl: '/users/1' })
  const app = createApp({})
  app.use(router)
  await router.start()

  onTestFinished(() => router.stop())

  const { value } = app.runWithContext(() => useParam(userId))

  expect(value.value).toBe(1)

  await router.push('user', { id: 2 })

  expect(value.value).toBe(2)
})

test('destructured values follows navigation', async () => {
  const userId = createParam(Number)
  const route = createRoute({ name: 'user', path: withParams('/users/[id]', { id: userId }) })
  const router = createRouter([route], { initialUrl: '/users/1' })
  const app = createApp({})
  app.use(router)
  await router.start()

  onTestFinished(() => router.stop())

  const { values } = app.runWithContext(() => useParam(userId))

  expect(values.value).toEqual([1])

  await router.push('user', { id: 2 })

  expect(values.value).toEqual([2])
})

test('value is undefined when the definition is absent', async () => {
  const userId = createParam(Number)
  const route = createRoute({ name: 'home', path: '/' })
  const router = createRouter([route], { initialUrl: '/' })
  const app = createApp({})
  app.use(router)
  await router.start()

  onTestFinished(() => router.stop())

  const { value } = app.runWithContext(() => useParam(userId))

  expect(value.value).toBeUndefined()
})

test('values is empty when the definition is absent', async () => {
  const userId = createParam(Number)
  const route = createRoute({ name: 'home', path: '/' })
  const router = createRouter([route], { initialUrl: '/' })
  const app = createApp({})
  app.use(router)
  await router.start()

  onTestFinished(() => router.stop())

  const { values } = app.runWithContext(() => useParam(userId))

  expect(values.value).toEqual([])
})

test('value is a readonly ref', async () => {
  const userId = createParam(Number)
  const route = createRoute({ name: 'user', path: withParams('/users/[id]', { id: userId }) })
  const router = createRouter([route], { initialUrl: '/users/1' })
  const app = createApp({})
  app.use(router)
  await router.start()

  onTestFinished(() => router.stop())

  const { value } = app.runWithContext(() => useParam(userId))

  expect(isReadonly(value)).toBe(true)
})

test('values is a readonly ref', async () => {
  const userId = createParam(Number)
  const route = createRoute({ name: 'user', path: withParams('/users/[id]', { id: userId }) })
  const router = createRouter([route], { initialUrl: '/users/1' })
  const app = createApp({})
  app.use(router)
  await router.start()

  onTestFinished(() => router.stop())

  const { values } = app.runWithContext(() => useParam(userId))

  expect(isReadonly(values)).toBe(true)
})
