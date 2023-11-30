import { Ref } from 'vue'

export function useParam<T>(param: string): Ref<T | undefined>
export function useParam<T>(param: string, defaultValue: T): Ref<T>
export function useParam<T>(_param: string, _defaultValue?: T): Ref<T | undefined> {
  throw 'not implemented'
}