import { Param } from '@/types/paramTypes'

export type CombineState<
  TParent extends Record<string, Param>,
  TChild extends Record<string, Param>
> = Omit<TParent, keyof TChild> & TChild

export function combineState<TParentState extends Record<string, Param>, TChildState extends Record<string, Param>>(parentState: TParentState, childState: TChildState): CombineState<TParentState, TChildState>
export function combineState(parentState: Record<string, Param>, childState: Record<string, Param>): Record<string, Param> {
  return { ...parentState, ...childState }
}
