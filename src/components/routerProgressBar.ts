import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { UseNavigation } from '@/types/navigation'

export type RouterProgressBarProps = {
  navigation: UseNavigation,
  delay: number,
  color: string | undefined,
  label: string,
}

/**
 * How often the bar creeps toward the next unit while waiting on one.
 */
const TRICKLE_INTERVAL = 150
/**
 * How much of the remaining way to the next unit each creep covers, so the bar never reaches a unit that
 * has not settled.
 */
const TRICKLE_RATE = 0.08
/**
 * How long the bar takes to move to a new width, so a unit settling reads as motion rather than a jump.
 */
const FILL = 400
/**
 * How long the bar takes to fade once it is full.
 */
const FADE = 200
/**
 * Where the bar starts, so it is visible from the moment it appears.
 */
const INITIAL_WIDTH = 0.05

/**
 * The bar itself. RouterProgress mounts one instance per navigation, so the delay, the trickle, and the
 * width all start fresh when the next navigation replaces it.
 */
export const routerProgressBar = defineComponent((props: RouterProgressBarProps) => {
  const { pending, settled, total, progress } = props.navigation

  const shown = ref(false)
  const trickle = ref(0)
  let showTimer: ReturnType<typeof setTimeout> | undefined
  let trickleTimer: ReturnType<typeof setInterval> | undefined

  /**
   * Just short of the next unit, since that unit has not settled.
   */
  const ceiling = computed(() => {
    if (total.value === 0) {
      return 1
    }

    return Math.min(1, (settled.value + 1) / total.value)
  })

  const completed = computed(() => !pending.value && total.value > 0 && settled.value === total.value)

  const width = computed(() => {
    if (pending.value) {
      return Math.max(progress.value + trickle.value, INITIAL_WIDTH)
    }

    return completed.value ? 1 : 0
  })

  /**
   * Nothing renders until the delay has passed, so a quick navigation never shows a bar, and an element
   * that first appears at full opacity does not transition. A navigation that ends without completing
   * renders nothing again, so an abort just disappears.
   */
  const rendered = computed(() => shown.value && (pending.value || completed.value))

  onMounted(() => {
    // a navigation that already ended has nothing to show
    showTimer = setTimeout(() => {
      shown.value = pending.value
    }, props.delay)
  })

  watch(pending, (isPending) => {
    clearInterval(trickleTimer)

    if (isPending) {
      trickleTimer = setInterval(() => {
        trickle.value += (ceiling.value - progress.value - trickle.value) * TRICKLE_RATE
      }, TRICKLE_INTERVAL)
    }
  }, { immediate: true })

  watch(settled, () => {
    trickle.value = 0
  })

  onBeforeUnmount(() => {
    clearTimeout(showTimer)
    clearInterval(trickleTimer)
  })

  return () => {
    if (!rendered.value) {
      return null
    }

    const percent = Math.round(width.value * 100)

    return h('div', {
      'class': 'router-progress',
      'role': 'progressbar',
      'aria-label': props.label,
      'aria-valuemin': 0,
      'aria-valuemax': 100,
      'aria-valuenow': percent,
      'style': {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--router-progress-height, 3px)',
        zIndex: 9999,
        pointerEvents: 'none',
        opacity: pending.value ? 1 : 0,
        // the fade waits for the fill to land
        transition: `opacity ${FADE}ms ease-out ${FILL}ms`,
      },
    }, h('div', {
      class: 'router-progress__bar',
      style: {
        height: '100%',
        width: `${percent}%`,
        background: props.color ?? 'var(--router-progress-color, #29d)',
        transition: `width ${FILL}ms ease-out`,
      },
    }))
  }
}, {
  name: 'RouterProgressBar',
  // eslint-disable-next-line vue/require-prop-types
  props: ['navigation', 'delay', 'color', 'label'],
})
