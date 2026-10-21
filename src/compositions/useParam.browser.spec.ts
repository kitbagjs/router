import { mount } from '@vue/test-utils'
import { isReadonly } from 'vue'
import { expect, onTestFinished, test } from 'vitest'
import { createParam, createRoute, createRouter, useParam, withParams } from '@/main'

test('value contains the first matching param', async () => {
  const userId = createParam(Number)
  const route = createRoute({ name: 'users', path: withParams('/users/[from]/[to]', { from: userId, to: userId }) })
  const router = createRouter([route], { initialUrl: '/users/1/2' })
  await router.start()

  onTestFinished(() => router.stop())

  const wrapper = mount({
    template: 'empty',
    setup() {
      const { value, values } = useParam(userId)

      return { value, values }
    },
  }, {
    global: { plugins: [router] },
  })
  onTestFinished(() => wrapper.unmount())

  expect(wrapper.vm.value).toBe(1)
})

test('values contains all matching params', async () => {
  const userId = createParam(Number)
  const route = createRoute({ name: 'users', path: withParams('/users/[from]/[to]', { from: userId, to: userId }) })
  const router = createRouter([route], { initialUrl: '/users/1/2' })
  await router.start()

  onTestFinished(() => router.stop())

  const wrapper = mount({
    template: 'empty',
    setup() {
      const { value, values } = useParam(userId)

      return { value, values }
    },
  }, {
    global: { plugins: [router] },
  })
  onTestFinished(() => wrapper.unmount())

  expect(wrapper.vm.values).toEqual([1, 2])
})

test('destructured value follows navigation', async () => {
  const userId = createParam(Number)
  const route = createRoute({ name: 'user', path: withParams('/users/[id]', { id: userId }) })
  const router = createRouter([route], { initialUrl: '/users/1' })
  await router.start()

  onTestFinished(() => router.stop())

  const wrapper = mount({
    template: 'empty',
    setup() {
      const { value, values } = useParam(userId)

      return { value, values }
    },
  }, {
    global: { plugins: [router] },
  })
  onTestFinished(() => wrapper.unmount())

  expect(wrapper.vm.value).toBe(1)

  await router.push('user', { id: 2 })

  expect(wrapper.vm.value).toBe(2)
})

test('destructured values follows navigation', async () => {
  const userId = createParam(Number)
  const route = createRoute({ name: 'user', path: withParams('/users/[id]', { id: userId }) })
  const router = createRouter([route], { initialUrl: '/users/1' })
  await router.start()

  onTestFinished(() => router.stop())

  const wrapper = mount({
    template: 'empty',
    setup() {
      const { value, values } = useParam(userId)

      return { value, values }
    },
  }, {
    global: { plugins: [router] },
  })
  onTestFinished(() => wrapper.unmount())

  expect(wrapper.vm.values).toEqual([1])

  await router.push('user', { id: 2 })

  expect(wrapper.vm.values).toEqual([2])
})

test('value is undefined when the definition is absent', async () => {
  const userId = createParam(Number)
  const route = createRoute({ name: 'home', path: '/' })
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()

  onTestFinished(() => router.stop())

  const wrapper = mount({
    template: 'empty',
    setup() {
      const { value, values } = useParam(userId)

      return { value, values }
    },
  }, {
    global: { plugins: [router] },
  })
  onTestFinished(() => wrapper.unmount())

  expect(wrapper.vm.value).toBeUndefined()
})

test('values is empty when the definition is absent', async () => {
  const userId = createParam(Number)
  const route = createRoute({ name: 'home', path: '/' })
  const router = createRouter([route], { initialUrl: '/' })
  await router.start()

  onTestFinished(() => router.stop())

  const wrapper = mount({
    template: 'empty',
    setup() {
      const { value, values } = useParam(userId)

      return { value, values }
    },
  }, {
    global: { plugins: [router] },
  })
  onTestFinished(() => wrapper.unmount())

  expect(wrapper.vm.values).toEqual([])
})

test('value is a readonly ref', async () => {
  const userId = createParam(Number)
  const route = createRoute({ name: 'user', path: withParams('/users/[id]', { id: userId }) })
  const router = createRouter([route], { initialUrl: '/users/1' })
  await router.start()

  onTestFinished(() => router.stop())

  const wrapper = mount({
    template: 'empty',
    setup() {
      const { value, values } = useParam(userId)

      expect(isReadonly(value)).toBe(true)

      return { value, values }
    },
  }, {
    global: { plugins: [router] },
  })
  onTestFinished(() => wrapper.unmount())
})

test('values is a readonly ref', async () => {
  const userId = createParam(Number)
  const route = createRoute({ name: 'user', path: withParams('/users/[id]', { id: userId }) })
  const router = createRouter([route], { initialUrl: '/users/1' })
  await router.start()

  onTestFinished(() => router.stop())

  const wrapper = mount({
    template: 'empty',
    setup() {
      const { value, values } = useParam(userId)

      expect(isReadonly(values)).toBe(true)

      return { value, values }
    },
  }, {
    global: { plugins: [router] },
  })
  onTestFinished(() => wrapper.unmount())
})
