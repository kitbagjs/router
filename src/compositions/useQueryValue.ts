import { computed, Ref, MaybeRefOrGetter, toValue, InjectionKey } from 'vue'
import { createUseRoute } from './useRoute'
import { Router } from '@/types/router'
import { ParamOptions, ParamGetSetOptions } from '@/types/paramTypes'
import { ExtractParamType } from '@/types/params'
import { safeGetParamValue, setParamValue } from '@/services/params'
import { isParamWithDefault } from '@/services/withDefault'

type UseQueryValue<T> = {
  value: Ref<T>,
  values: Ref<NonNullable<T>[]>,
  remove: () => void,
}

type UseQueryValueFunction = {
  (key: MaybeRefOrGetter<string>): UseQueryValue<string | null>,
  <TParamOptions extends ParamOptions>(
    key: MaybeRefOrGetter<string>,
    param: TParamOptions,
  ): TParamOptions extends Required<ParamGetSetOptions<ExtractParamType<TParamOptions>>>
    ? UseQueryValue<ExtractParamType<TParamOptions>>
    : UseQueryValue<ExtractParamType<TParamOptions> | null>,
}

export function createUseQueryValue<TRouter extends Router>(key: InjectionKey<TRouter>): UseQueryValueFunction {
  const useRoute = createUseRoute(key)

  return (key: MaybeRefOrGetter<string>, param: ParamOptions = String): UseQueryValue<any> => {
    const route = useRoute()

    const value = computed({
      get() {
        const value = route.query.get(toValue(key))

        if (value === null) {
          if (isParamWithDefault(param)) {
            return param.defaultValue
          }
          return null
        }

        return safeGetParamValue(value, { param })
      },
      set(value) {
        route.query.set(toValue(key), setParamValue(value, { param }))
      },
    })

    const values = computed({
      get() {
        const values = route.query.getAll(toValue(key))

        if (values.length === 0 && isParamWithDefault(param)) {
          return [param.defaultValue]
        }

        return values
          .map((value) => safeGetParamValue(value, { param }))
          .filter((value) => value !== null)
      },
      set(values) {
        const query = new URLSearchParams(route.query)

        query.delete(toValue(key))

        values.forEach((value) => {
          query.append(toValue(key), setParamValue(value, { param }))
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
}
