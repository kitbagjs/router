import { watch, toValue, MaybeRefOrGetter, onScopeDispose } from 'vue'

export function useEventListener<K extends keyof HTMLElementEventMap>(target: MaybeRefOrGetter<HTMLElement | undefined | null>, key: K, callback: (this: HTMLElement, event: HTMLElementEventMap[K]) => unknown): void {

  function addEventListener(): void {
    toValue(target)?.addEventListener(key, callback)
  }

  function removeEventListener(): void {
    toValue(target)?.removeEventListener(key, callback)
  }

  onScopeDispose(() => removeEventListener())

  watch(() => toValue(target), () => {
    removeEventListener()
    addEventListener()
  }, { immediate: true })
}