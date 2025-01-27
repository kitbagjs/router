import { CallbackContext } from '@/services/createCallbackContext'
import { PropsGetter } from '@/types/createRouteOptions'
import { Route } from '@/types/route'

/**
 * Context provided to props callback functions
 */
export type PropsCallbackContext<
  TParent extends Route | undefined = Route | undefined
> = {
  push: CallbackContext['push'],
  replace: CallbackContext['replace'],
  reject: CallbackContext['reject'],
  parent: PropsCallbackParent<TParent>,
}

export type PropsCallbackParent<
  TParent extends Route | undefined = Route | undefined
> = Route | undefined extends TParent
  ? undefined | { name: string, props: unknown }
  : TParent extends Route
    ? { name: TParent['name'], props: GetParentPropsReturnType<TParent> }
    : undefined

type GetParentPropsReturnType<
  TParent extends Route | undefined = Route | undefined
> = TParent extends Route
  ? TParent['matched']['props'] extends PropsGetter
    ? ReturnType<TParent['matched']['props']>
    : TParent['matched']['props'] extends Record<string, PropsGetter>
      ? { [K in keyof TParent['matched']['props']]: ReturnType<TParent['matched']['props'][K]> }
      : undefined
  : undefined
