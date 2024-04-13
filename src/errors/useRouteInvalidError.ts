export class UseRouteInvalidError extends Error {
  public constructor(routeName: string, actualRouteName: string) {
    super(`useRoute called with incorrect route. Given ${routeName}, expected ${actualRouteName}`)
  }
}