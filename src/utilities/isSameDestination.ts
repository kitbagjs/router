import { ResolvedRoute } from '@/types/resolved'
import { isSameState } from '@/utilities/isSameState'

export type Destination = Pick<ResolvedRoute, 'id' | 'href'> & {
  state: Record<string, string | undefined>,
}

export function isSameDestination(destination: Destination | undefined, other: Destination | undefined): boolean {
  if (!destination || !other) {
    return destination === other
  }

  return destination.id === other.id
    && destination.href === other.href
    && isSameState(destination.state, other.state)
}
