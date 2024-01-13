import { PropType, defineComponent, h } from 'vue'
import { useRouter } from '@/compositions/useRouter'
import { RouteMethod } from '@/types/routeMethod'

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
    },
  },
  setup(props, { slots }) {
    const router = useRouter()

    function onClick(event: PointerEvent): void {
      event.preventDefault()

      const { url } = props.to()

      router.push(url, {
        replace: props.replace,
      })
    }

    return () => h('a', {
      href: props.to().url,
      onClick,
    }, slots.default?.())
  },
})