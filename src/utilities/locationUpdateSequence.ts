import { NavigationAbortError } from '@/errors/navigationAbortError'

type LocationUpdateSequenceOptions = {
  onBeforeLocationUpdate: () => Promise<boolean> | undefined,
  updateLocation?: () => void,
  onAfterLocationUpdate: () => Promise<void> | undefined,
}

export async function executeLocationUpdateSequence({ onBeforeLocationUpdate, updateLocation, onAfterLocationUpdate }: LocationUpdateSequenceOptions): Promise<void> {
  try {
    const shouldRunOnAfterLocationUpdate = await onBeforeLocationUpdate()

    updateLocation?.()

    if (shouldRunOnAfterLocationUpdate) {
      await onAfterLocationUpdate()
    }
  } catch (error) {
    if (error instanceof NavigationAbortError) {
      return
    }

    throw error
  }
}