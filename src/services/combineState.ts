import { ParamOptions } from '@/types/paramTypes'
import { checkDuplicateParams } from '@/utilities/checkDuplicateParams'

export type CombineState<
  TParent extends Record<string, ParamOptions>,
  TChild extends Record<string, ParamOptions>
> = TParent & TChild

export function combineState<TParentState extends Record<string, ParamOptions>, TChildState extends Record<string, ParamOptions>>(parentState: TParentState, childState: TChildState): CombineState<TParentState, TChildState>
export function combineState(parentState: Record<string, ParamOptions>, childState: Record<string, ParamOptions>): Record<string, ParamOptions> {
  checkDuplicateParams(parentState, childState)

  return { ...parentState, ...childState }
}
