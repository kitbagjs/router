# Types: RouterRouteHookBeforeRunner()\<TRoutes\>

```ts
type RouterRouteHookBeforeRunner<TRoutes> = (context) => Promise<BeforeRouteHookResponse>;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | [`HookContext`](HookContext.md)\<`TRoutes`\> |

## Returns

`Promise`\<[`BeforeRouteHookResponse`](BeforeRouteHookResponse.md)\>
