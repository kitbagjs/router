import { DuplicateNamesError } from '@/errors/duplicateNamesError'
import { Routes } from '@/types/route'
import { getCount } from '@/utilities/array'

export function checkDuplicateNames(routes: Routes): void {
  const names = routes.map(({ name }) => name)

  for (const name of names) {
    if (getCount(names, name) > 1) {
      throw new DuplicateNamesError(name)
    }
  }
}
