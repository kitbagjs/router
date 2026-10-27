# Types: AddRejectionHook\<TRejections, TRoutes, TRouteTo, TRouteFrom\>

```ts
type AddRejectionHook<TRejections, TRoutes, TRouteTo, TRouteFrom> = (hook, options?) => HookRemove;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-trejections"></a> `TRejections` *extends* `string` | `string` |
| <a id="type-parameter-troutes"></a> `TRoutes` *extends* `Routes` | `Routes` |
| <a id="type-parameter-trouteto"></a> `TRouteTo` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |
| <a id="type-parameter-troutefrom"></a> `TRouteFrom` *extends* [`Route`](Route.md) | `TRoutes`\[`number`\] |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hook` | [`RejectionHook`](RejectionHook.md)\<`TRejections`, `TRoutes`, `TRouteTo`, `TRouteFrom`\> |
| `options?` | [`HookRegistrationOptions`](HookRegistrationOptions.md) |

## Returns

[`HookRemove`](HookRemove.md)
