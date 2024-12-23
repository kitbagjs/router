import { onUnmounted, Ref, watch } from "vue";

export function useEventListener<K extends keyof HTMLElementEventMap>(element: Ref<HTMLElement | undefined>, event: K, handler: (event: HTMLElementEventMap[K]) => void): void {
  watch(element, (element, previousElement) => {
    if (element) {
      element.addEventListener(event, handler)
    }
    
    if (previousElement) {
      previousElement.removeEventListener(event, handler)
    }
  }, { immediate: true })

  onUnmounted(() => {
    if (element.value) {
      element.value.removeEventListener(event, handler)
    }
  })
}
