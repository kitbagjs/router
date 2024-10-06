import { InjectionKey, reactive } from 'vue'
import { isWithComponent, isWithComponents } from '@/types/createRouteOptions'
import { ResolvedRoute } from '@/types/resolved'
import { Route } from '@/types/route'
import { MaybePromise } from '@/types/utilities'

export const propStoreKey: InjectionKey<PropStore> = Symbol()

type ComponentProps = { id: string, name: string, props?: (params: Record<string, unknown>) => unknown }

export class PropStore {
  private readonly store = reactive(new Map<string, unknown>())

  public setProps(route: ResolvedRoute): void {
    this.store.clear()

    route.matches
      .flatMap(match => this.getComponentProps(match))
      .forEach(({ id, name, props }) => {
        if (props) {
          const key = this.getPropKey(id, name, route.params)
          const value = props(route.params)

          this.store.set(key, value)
        }
      })
  }

  public getProps(id: string, name: string, params: unknown): MaybePromise<unknown> | undefined {
    const key = this.getPropKey(id, name, params)

    return this.store.get(key)
  }

  private getPropKey(id: string, name: string, params: unknown): string {
    return [id, name, JSON.stringify(params)].join('-')
  }

  private getComponentProps(options: Route['matched']): ComponentProps[] {
    if (isWithComponents(options)) {
      return Object.entries(options.props ?? {}).map(([name, props]) => ({ id: options.id, name, props }))
    }

    if (isWithComponent(options)) {
      return [
        {
          id: options.id,
          name: 'default',
          props: options.props,
        },
      ]
    }

    return []
  }
}