import { isBrowser } from "@/utilities/isBrowser"
import { reactive } from "vue"

export type VisibilityObserver = {
  observe: (element: Element) => void,
  unobserve: (element: Element) => void,
  disconnect: () => void,
  isElementVisible: (element: Element) => boolean,
}

export function createVisibilityObserver(): VisibilityObserver {
  const elements = reactive(new Map<Element, boolean>())

  const observer = isBrowser() ? createObserver() : null

  const observe: VisibilityObserver['observe'] = (element) => {
    elements.set(element, false)
    observer?.observe(element)
  }

  const unobserve: VisibilityObserver['unobserve'] = (element) => {
    elements.delete(element)
    observer?.unobserve(element)
  }

  const disconnect: VisibilityObserver['disconnect'] = () => {
    observer?.disconnect()
  }

  const isElementVisible: VisibilityObserver['isElementVisible'] = (element) => {
    return elements.get(element) ?? false
  }

  function createObserver(): IntersectionObserver {
    return new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        elements.set(entry.target, entry.isIntersecting)
      })
    })
  }

  return {
    observe,
    unobserve,
    disconnect,
    isElementVisible,
  }
}
