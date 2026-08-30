import { flushPromises, mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { defineComponent, h } from 'vue'
import { useHasSuspenseBoundary } from '@/compositions/useHasSuspenseBoundary'

const component = defineComponent({
  setup() {
    const hasSuspense = useHasSuspenseBoundary()

    return () => h('span', String(hasSuspense))
  },
})

test('is true inside a suspense boundary', async () => {
  const wrapper = mount({ template: '<Suspense><component-under-test/></Suspense>', components: { componentUnderTest: component } })

  await flushPromises()

  expect(wrapper.text()).toBe('true')
})

test('is false outside a suspense boundary', () => {
  const wrapper = mount({ template: '<component-under-test/>', components: { componentUnderTest: component } })

  expect(wrapper.text()).toBe('false')
})
