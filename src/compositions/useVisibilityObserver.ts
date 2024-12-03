import { RouterNotInstalledError } from "@/errors/routerNotInstalledError"
import { VisibilityObserver } from "@/services/createVisibilityObserver"
import { inject, InjectionKey } from "vue"

export const visibilityObserverKey: InjectionKey<VisibilityObserver> = Symbol('visibilityObserver')

export function useVisibilityObserver(): VisibilityObserver {
  const observer = inject(visibilityObserverKey)

  if (!observer) {
    throw new RouterNotInstalledError()
  }

  return observer
}
