import { DuplicateNamesError } from '@/errors/duplicateNamesError'
import { Route, Routes } from '@/types/route'

export function checkDuplicateNames(routes: Routes): void {
  routes.reduce((grouped, route) => {
    if (!grouped.has(route.name)) {
      grouped.set(route.name, route)

      return grouped
    }

    const existingRoute = grouped.get(route.name)
    if (existingRoute?.id !== route.id) {
      throw new DuplicateNamesError(route.name)
    }

    return grouped
  }, new Map<string, Route>())
}
