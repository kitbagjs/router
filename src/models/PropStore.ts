import { InjectionKey } from 'vue'
import { CreateRouteOptions, isWithComponent, isWithComponents } from '@/types/createRouteOptions'
import { ResolvedRoute } from '@/types/resolved'
import { MaybePromise } from '@/types/utilities'

export const propStoreKey: InjectionKey<PropStore> = Symbol()

type NamedComponentProps = { name: string, props?: (params: Record<string, unknown>) => MaybePromise<Record<string, unknown>> }

export class PropStore {
  private readonly store = new Map<string, MaybePromise<Record<string, unknown>>>()

  public setProps(route: ResolvedRoute): void {
    this.store.clear()

    route.matches
      .flatMap(match => this.getComponentProps(match))
      .forEach(({ name, props }) => {
        if (props) {
          const key = this.getPropKey(route, name)
          const value = props(route.params)

          this.store.set(key, value)
        }
      })
  }

  public getProps(route: ResolvedRoute, name: string = 'default'): MaybePromise<Record<string, unknown>> | undefined {
    const key = this.getPropKey(route, name)

    return this.store.get(key)
  }

  private getPropKey(route: ResolvedRoute, name: string = 'default'): string {
    return [route.id, name, JSON.stringify(route.params)].join('-')
  }

  private getComponentProps(options: CreateRouteOptions): NamedComponentProps[] {
    if (isWithComponents(options)) {
      return Object.entries(options.props ?? {}).map(([name, props]) => ({ name, props }))
    }

    if (isWithComponent(options)) {
      return [{ name: 'default', props: options.props }]
    }

    return []
  }
}