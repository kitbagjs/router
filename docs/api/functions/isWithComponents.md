# Functions: isWithComponents()

```ts
function isWithComponents<T>(options): options is T & { components: Record<string, Component> };
```

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `Record`\<`string`, `unknown`\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `T` |

## Returns

`options is T & { components: Record<string, Component> }`
