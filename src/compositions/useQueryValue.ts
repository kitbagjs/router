import { computed, Ref, MaybeRefOrGetter, toValue } from 'vue'
import { useRoute } from './useRoute'
import { Param } from '@/types'
import { ExtractParamType } from '@/types/params'
import { safeGetParamValue, setParamValue } from '@/services/params'

export type UseQueryValue<T> = {
  value: Ref<T | null>,
  values: Ref<T[]>,
  remove: () => void,
}

export function useQueryValue(key: MaybeRefOrGetter<string>): UseQueryValue<string>

export function useQueryValue<
  TParam extends Param
>(
  key: MaybeRefOrGetter<string>,
  param: TParam
): UseQueryValue<ExtractParamType<TParam>>

export function useQueryValue(
  key: MaybeRefOrGetter<string>,
  param: Param = String,
): UseQueryValue<unknown> {
  const route = useRoute()

  const value = computed({
    get() {
      const value = route.query.get(toValue(key))

      if (value === null) {
        return null
      }

      return safeGetParamValue(value, param)
    },
    set(value) {
      route.query.set(toValue(key), setParamValue(value, param))
    },
  })

  const values = computed({
    get() {
      const values = route.query.getAll(toValue(key))

      return values
        .map((value) => safeGetParamValue(value, param))
        .filter((value) => value !== null)
    },
    set(values) {
      const query = new URLSearchParams(route.query.toString())

      query.delete(toValue(key))

      values.forEach((value) => {
        query.append(toValue(key), setParamValue(value, param))
      })

      route.query = query
    },
  })

  return {
    value,
    values,
    remove: () => {
      route.query.delete(toValue(key))
    },
  }
}
