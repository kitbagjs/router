import { ref } from 'vue'

export const activity = ref<string[]>([])

export function record(message: string): void {
  activity.value.unshift(`${new Date().toLocaleTimeString()} · ${message}`)
}

export async function request<T>(name: string, value: T, signal: AbortSignal): Promise<T> {
  record(`${name} started`)
  signal.throwIfAborted()
  await new Promise((resolve) => setTimeout(resolve, 400))
  signal.throwIfAborted()
  record(`${name} completed`)
  return value
}
