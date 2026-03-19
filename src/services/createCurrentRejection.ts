import { Rejection, RouterRejection } from '@/types/rejection'
import { ref } from 'vue'

type RejectionUpdate = (rejection: Rejection) => void
type RejectionClear = () => void

type CurrentRejectionContext = {
  currentRejection: RouterRejection,
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

  return {
    currentRejection,
    updateRejection,
    clearRejection,
  }
}
