import { PropType, defineComponent, h } from 'vue'
import { useRouter } from '@/compositions/useRouter'
import { RouteMethod } from '@/types'

export default defineComponent({
  name: 'RouterLink',
  expose: [],
  props: {
    to: {
      type: Function as PropType<() => ReturnType<RouteMethod>>,
      required: true,
    },
    replace: {
      type: Boolean,
      required: false,
    },
  },
  setup(props) {
    const router = useRouter()

    function onClick(event: PointerEvent): void {
      event.preventDefault()

      const method = props.replace ? router.replace : router.push

      method(props.to().url)
    }

    return h('a', {
      href: props.to().url,
      onClick,
    })
  },
})