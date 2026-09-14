import { createSSRApp, defineComponent, h } from 'vue'
import { expect, test } from 'vitest'
import { renderToString } from 'vue/server-renderer'
import { useIsServerRendering } from '@/compositions/useIsServerRendering'

test('is true while server rendering', async () => {
  const component = defineComponent({
    setup() {
      const isServerRendering = useIsServerRendering()

      return () => h('div', String(isServerRendering))
    },
  })

  const html = await renderToString(createSSRApp({ render: () => h(component) }))

  expect(html).toBe('<div>true</div>')
})
