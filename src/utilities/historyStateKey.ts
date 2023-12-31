export class HistoryStateKey {
  private static key: number = this.getKeyValue()

  public static get(): number {
    return this.key
  }

  public static next(): number {
    this.key = this.getKeyValue()

    return this.key
  }

  private static getKeyValue(): number {
    return Date.now()
  }
}