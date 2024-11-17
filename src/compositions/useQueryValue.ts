import { computed, Ref, MaybeRefOrGetter, toValue } from 'vue'
import { useRoute } from './useRoute'
import { Param } from '@/types'
import { ExtractParamType } from '@/types/params'
import { getParamValue, setParamValue } from '@/services/params'
import { InvalidRouteParamValueError } from '@/errors/invalidRouteParamValueError'

export type UseQueryValue<T> = {
  value: Ref<T | null>,
  values: Ref<T[]>,
}

export function useQueryValue<
  TParam extends Param,
  TParamType extends ExtractParamType<TParam>
>(
  key: MaybeRefOrGetter<string>,
  type: TParam,
): UseQueryValue<TParamType> {
  const route = useRoute()

  const value = computed<TParamType | null>({
    get() {
      const value = route.query.get(toValue(key))

      if (value === null) {
        return null
      }

      try {
        return getParamValue(value, type)
      } catch (error) {
        if (error instanceof InvalidRouteParamValueError) {
          return null
        }

        throw error
      }
    },
    set(value: TParamType | null) {
      route.query.set(toValue(key), setParamValue(value, type))
    },
  })

  const values = computed<TParamType[]>({
    get() {
      const values = route.query.getAll(toValue(key))

      return values
        .map((value) => {
          try {
            return getParamValue(value, type)
          } catch (error) {
            if (error instanceof InvalidRouteParamValueError) {
              return null
            }
            throw error
          }
        })
        .filter((value): value is TParamType => value !== null)
    },
    set(values: TParamType[]) {
      route.query.delete(toValue(key))

      values.forEach((value) => {
        route.query.append(toValue(key), setParamValue(value, type))
      })
    },
  })

  return {
    value,
    values,
  }
}
