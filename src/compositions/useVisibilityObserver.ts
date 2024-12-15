import { RouterNotInstalledError } from "@/errors/routerNotInstalledError"
import { VisibilityObserver } from "@/services/createVisibilityObserver"
import { computed, inject, InjectionKey, Ref, watch } from "vue"

type UseVisibilityObserver = {
  isElementVisible: Ref<boolean>
}

export const visibilityObserverKey: InjectionKey<VisibilityObserver> = Symbol('visibilityObserver')

export function useVisibilityObserver(element: Ref<Element | undefined>): UseVisibilityObserver {
  const observer = inject(visibilityObserverKey)

  if (!observer) {
    throw new RouterNotInstalledError()
  }

  watch(element, (element, previousElement) => {
    if (element) {
      observer.observe(element)
    }

    if (previousElement) {
      observer.unobserve(previousElement)
    }
  }, { immediate: true })

  const isElementVisible = computed(() => {
    if (!element.value) {
      return false
    }

    return observer.isElementVisible(element.value)
  })

  return {
    isElementVisible,
  }
}