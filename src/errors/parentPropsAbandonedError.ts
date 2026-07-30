export class ParentPropsAbandonedError extends Error {
  public constructor() {
    super('Parent props were discarded before they were computed because navigation moved elsewhere.')
  }
}
