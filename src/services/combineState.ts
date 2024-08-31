import { Param } from '@/types/paramTypes'
import { checkDuplicateParams } from '@/utilities/checkDuplicateKeys'

export type CombineState<
  TParent extends Record<string, Param>,
  TChild extends Record<string, Param>
> = TParent & TChild

export function combineState<TParentState extends Record<string, Param>, TChildState extends Record<string, Param>>(parentState: TParentState, childState: TChildState): CombineState<TParentState, TChildState>
export function combineState(parentState: Record<string, Param>, childState: Record<string, Param>): Record<string, Param> {
  checkDuplicateParams(parentState, childState)

  return { ...parentState, ...childState }
}