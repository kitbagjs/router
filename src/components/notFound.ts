/* eslint-disable vue/require-expose */

import { defineComponent, h } from 'vue'

export const notFoundText = 'Not Found'

export default defineComponent(() => {
  return () => h('h1', notFoundText)
}, {
  name: 'NotFound',
  props: [],
})