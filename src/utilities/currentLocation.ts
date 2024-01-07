import { updateBrowserUrl } from '@/utilities/updateBrowserUrl'

let currentLocation = ''

type SetCurrentLocationOptions = {
  replace?: boolean,
}

export function setCurrentLocation(value: string, options: SetCurrentLocationOptions = {}): void {
  currentLocation = value

  updateBrowserUrl(value, options)
}

export function getCurrentLocation(): string {
  return currentLocation
}