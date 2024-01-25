import { Resolved, Route, RouterPush, RouterPushOptions } from '@/types'
import { RouterNavigation } from '@/utilities/routerNavigation'

type RouterPushContext = {
  navigation: RouterNavigation,
  resolved: Resolved<Route>[],
}

export function createRouterPush({ navigation }: RouterPushContext): RouterPush {
  const push: RouterPush = (url, options?: RouterPushOptions) => {
    return navigation.update(url, options)
  }

  return push
}