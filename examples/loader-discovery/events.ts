import { ref } from 'vue'

export const events = ref<{ message: string, time: string }[]>([])

export function record(message: string): void {
  events.value.push({ message, time: new Date().toLocaleTimeString() })
}
