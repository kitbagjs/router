/* eslint-disable vue/require-expose */

import { defineComponent, h } from 'vue'

export default defineComponent(() => {
  return () => h('h1', 'Not Found')
}, {
  name: 'NotFound',
  props: [],
})