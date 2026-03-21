import { isRejection, Rejection, RouterRejection } from '@/types/rejection'
import { ref, ComputedRef, computed } from 'vue'
import { ResolvedRoute } from '@/types/resolved'
import { createResolvedRoute } from './createResolvedRoute'

type RejectionUpdate = (rejection: Rejection) => void
type RejectionClear = () => void

type CurrentRejectionContext = {
  currentRejection: RouterRejection,
  currentRejectionRoute: ComputedRef<ResolvedRoute | null>,
  updateRejection: RejectionUpdate,
  clearRejection: RejectionClear,
}

export function createCurrentRejection(): CurrentRejectionContext {
  const updateRejection: RejectionUpdate = (newRejection) => {
    currentRejection.value = newRejection
  }

  const clearRejection: RejectionClear = () => {
    currentRejection.value = null
  }

  const currentRejection: RouterRejection = ref<Rejection | null>(null)

  const currentRejectionRoute = computed(() => {
    if (isRejection(currentRejection.value)) {
      return createResolvedRoute(currentRejection.value.route)
    }

    return null
  })

  return {
    currentRejection,
    currentRejectionRoute,
    updateRejection,
    clearRejection,
  }
}
