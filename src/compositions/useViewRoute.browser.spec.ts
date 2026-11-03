/* eslint-disable vue/one-component-per-file */
import { mount } from '@vue/test-utils'
import { expect, test } from 'vitest'
import { defineComponent, provide, shallowRef, ShallowRef } from 'vue'
import { createUseViewRoute, getViewRouteInjectionKey } from './useViewRoute'
import { createRoute } from '@/services/createRoute'
import { createResolvedRoute } from '@/services/createResolvedRoute'
import { createRouter } from '@/services/createRouter'
import { ResolvedRoute } from '@/types/resolved'

test('uses the rendered view route when provided', () => {
  const definition = createRoute({ path: '/' })
  const router = createRouter([definition])
  const provided = shallowRef(createResolvedRoute(definition))
  let selected: ShallowRef<ResolvedRoute> | undefined
  const child = defineComponent({
    setup() {
      selected = createUseViewRoute(router.key)()
      return () => null
    },
  })
  const wrapper = mount({
    setup() {
      provide(getViewRouteInjectionKey(router.key), provided)
    },
    components: { child },
    template: '<child />',
  })

  expect(selected).toBe(provided)
  wrapper.unmount()
})

test('outside a view follows the routers resolved route', async () => {
  const definition = createRoute({ name: 'user', path: '/[id]' })
  const router = createRouter([definition], { initialUrl: '/1' })
  let selected: ShallowRef<ResolvedRoute> | undefined
  const wrapper = mount(defineComponent({
    setup() {
      selected = createUseViewRoute(router.key)()
      return () => null
    },
  }), { global: { plugins: [router] } })
  await router.start()
  const first = selected?.value
  await router.push('/2')

  expect(router.route.href).toBe('/2')
  expect(selected?.value).not.toBe(first)
  expect(selected?.value.params.id).toBe('2')
  wrapper.unmount()
  router.stop()
})
