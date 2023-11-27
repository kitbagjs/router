import { Ref } from "vue";

export function useParamRaw(param: string): Ref<string | undefined>
export function useParamRaw(param: string, defaultValue: string): Ref<string>
export function useParamRaw(_param: string, _defaultValue?: string): Ref<string | undefined> {
  throw 'not implemented'
}