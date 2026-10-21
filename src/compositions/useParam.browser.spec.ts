import { mount } from '@vue/test-utils'
import { isReadonly } from 'vue'
import { expect, test } from 'vitest'
import { createParam, createRoute, createRouter, createRouterAssets, useParam, withDefault, withParams } from '@/main'

test.each(['global', 'router assets'] as const)('%s param refs follow navigation after destructuring', async (source) => {
  const userId = createParam(Number)
  const defaultedId = withDefault(userId, 3)
  const users = createRoute({
    name: 'users',
    path: withParams('/users/[from]/[to]', { from: userId, to: userId }),
    query: withParams('owner=[?owner]', { owner: defaultedId }),
  })
  const other = createRoute({ name: 'other', path: '/other' })
  const router = createRouter([users, other], { initialUrl: '/users/1/2' })
  const useRouterParam = source === 'global' ? useParam : createRouterAssets(router).useParam

  await router.start()

  const wrapper = mount({
    template: '{{ value }}:{{ values }}',
    setup() {
      const { value, values } = useRouterParam(defaultedId)

      expect(isReadonly(value)).toBe(true)
      expect(isReadonly(values)).toBe(true)

      return { value, values }
    },
  }, {
    global: { plugins: [router] },
  })

  expect(wrapper.vm.value).toBe(1)
  expect(wrapper.vm.values).toEqual([1, 2, 3])

  await router.push('users', { from: 0, to: 4, owner: 5 })

  expect(wrapper.vm.value).toBe(0)
  expect(wrapper.vm.values).toEqual([0, 4, 5])

  await router.push('other')

  expect(wrapper.vm.value).toBeUndefined()
  expect(wrapper.vm.values).toEqual([])

  await router.push('users', { from: 6, to: 7 })

  expect(wrapper.vm.value).toBe(6)
  expect(wrapper.vm.values).toEqual([6, 7, 3])

  wrapper.unmount()
  router.stop()
})
