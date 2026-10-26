# Types: AddErrorHook\<TRoutes, TRejections\>

```ts
type AddErrorHook<TRoutes, TRejections> = (hook, options?) => HookRemove;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-troutes"></a> `TRoutes` *extends* `Routes` | `Routes` |
| <a id="type-parameter-trejections"></a> `TRejections` *extends* [`Rejections`](Rejections.md) | [`Rejections`](Rejections.md) |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `hook` | [`ErrorHook`](ErrorHook.md)\<`TRoutes`, `TRejections`\> |
| `options?` | [`HookRegistrationOptions`](HookRegistrationOptions.md) |

## Returns

[`HookRemove`](HookRemove.md)
