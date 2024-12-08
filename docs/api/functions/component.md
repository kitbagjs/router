# Functions: component()

```ts
function component<TComponent>(component, props): Component
```

Creates a component wrapper which has no props itself but mounts another component within while binding its props

## Type Parameters

| Type Parameter |
| ------ |
| `TComponent` *extends* `Component` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `component` | `TComponent` | The component to mount |
| `props` | `ComponentPropsGetter`\<`TComponent`\> | A callback that returns the props or attributes to bind to the component |

## Returns

`Component`

A component

## Example

```ts
import { createRoute, component } from '@kitbag/router'

export const routes = createRoute({
  name: 'User',
  path: '/',
  component: component(User, () => ({ userId: 1 }))
})
```
