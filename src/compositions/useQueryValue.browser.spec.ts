import { createRouter } from '@/services'
import { createRoute } from '@/services/createRoute'
import { expect, test } from 'vitest'
import { useQueryValue } from './useQueryValue'
import { flushPromises, mount } from '@vue/test-utils'

test('returns correct value and values when key does not exist', async () => {
  const root = createRoute({
    name: 'root',
    path: '/',
  })

  const router = createRouter([root], {
    initialUrl: '/',
  })

  await router.start()

  const component = {
    setup() {
      return useQueryValue('foo')
    },
  }

  const wrapper = mount(component, {
    global: {
      plugins: [router],
    },
  })

  expect(wrapper.vm.value).toBe(null)
  expect(wrapper.vm.values).toEqual([])
})

test('returns correct value and values when key does exist', async () => {
  const root = createRoute({
    name: 'root',
    path: '/',
  })

  const router = createRouter([root], {
    initialUrl: '/?foo=1&foo=2',
  })

  await router.start()

  const component = {
    setup() {
      return useQueryValue('foo')
    },
  }

  const wrapper = mount(component, {
    global: {
      plugins: [router],
    },
  })

  expect(wrapper.vm.value).toBe('1')
  expect(wrapper.vm.values).toEqual(['1', '2'])
})

test('returns correct value and values when a param is used', async () => {
  const root = createRoute({
    name: 'root',
    path: '/',
  })

  const router = createRouter([root], {
    initialUrl: '/?foo=1&foo=2',
  })

  await router.start()

  const component = {
    setup() {
      return useQueryValue('foo', Number)
    },
  }

  const wrapper = mount(component, {
    global: {
      plugins: [router],
    },
  })

  expect(wrapper.vm.value).toBe(1)
  expect(wrapper.vm.values).toEqual([1, 2])
})

test('updates value and values when the query string changes', async () => {
  const root = createRoute({
    name: 'root',
    path: '/',
  })

  const router = createRouter([root], {
    initialUrl: '/?foo=1&foo=2',
  })

  await router.start()

  const component = {
    setup() {
      return useQueryValue('foo', Number)
    },
  }

  const wrapper = mount(component, {
    global: {
      plugins: [router],
    },
  })

  expect(wrapper.vm.value).toBe(1)
  expect(wrapper.vm.values).toEqual([1, 2])

  await router.push('/?foo=3')

  expect(wrapper.vm.value).toBe(3)
  expect(wrapper.vm.values).toEqual([3])
})

test('updates the query string when the value is set', async () => {
  const root = createRoute({
    name: 'root',
    path: '/',
  })

  const router = createRouter([root], {
    initialUrl: '/?foo=1&foo=2',
  })

  await router.start()

  const component = {
    setup() {
      const { value } = useQueryValue('foo', Number)

      value.value = 3
    },
  }

  mount(component, {
    global: {
      plugins: [router],
    },
  })

  await flushPromises()

  expect(router.route.query.toString()).toBe('foo=3')
})

test('updates the query string when the values is set', async () => {
  const root = createRoute({
    name: 'root',
    path: '/',
  })

  const router = createRouter([root], {
    initialUrl: '/?foo=1&foo=2',
  })

  await router.start()

  const component = {
    setup() {
      const { values } = useQueryValue('foo', Number)

      values.value = [3, 4]
    },
  }

  mount(component, {
    global: {
      plugins: [router],
    },
  })

  await flushPromises()

  expect(router.route.query.toString()).toBe('foo=3&foo=4')
})

test('removes the query string when the remove method is called', async () => {
  const root = createRoute({
    name: 'root',
    path: '/',
  })

  const router = createRouter([root], {
    initialUrl: '/?foo=1&foo=2',
  })

  await router.start()

  const component = {
    setup() {
      const { remove } = useQueryValue('foo')

      remove()
    },
  }

  mount(component, {
    global: {
      plugins: [router],
    },
  })

  await flushPromises()

  expect(router.route.query.toString()).toBe('')
})
