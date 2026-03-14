# Functions: isWithHooks()

```ts
function isWithHooks<T>(route): route is T & WithHooks;
```

**`Internal`**

Type guard to assert that a route has hooks.

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `Record`\<`string`, `unknown`\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `route` | `T` |

## Returns

`route is T & WithHooks`
