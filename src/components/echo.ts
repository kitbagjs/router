import { defineComponent } from 'vue'

export default defineComponent((props) => {
  return () => props.value
}, {
  props: {
    value: {
      type: String,
      required: true,
    },
  },
})
