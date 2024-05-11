/* eslint-disable vue/no-unused-properties */
/* eslint-disable vue/require-name-property */
/* eslint-disable vue/require-expose */
import { defineComponent } from 'vue'

export default defineComponent(({ value }) => {
  return () => value
}, {
  props: {
    value: {
      type: String,
      required: true,
    },
  },
})