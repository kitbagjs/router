# Types: RouterRouteHookAfterRunner()\<TRoutes\>

```ts
type RouterRouteHookAfterRunner<TRoutes> = (context) => Promise<AfterRouteHookResponse>;
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

`Promise`\<[`AfterRouteHookResponse`](AfterRouteHookResponse.md)\>
