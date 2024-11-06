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
