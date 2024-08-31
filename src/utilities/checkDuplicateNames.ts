import { DuplicateNamesError } from '@/errors/duplicateNamesError'
import { getCount } from '@/utilities/array'

export function checkDuplicateNames(names: string[]): void {
  // const names = routesOrNames.flatMap(routeOrName => typeof routeOrName === 'string' ? routeOrName : routeOrName.name)

  for (const name of names) {
    if (getCount(names, name) > 1) {
      throw new DuplicateNamesError(name)
    }
  }
}