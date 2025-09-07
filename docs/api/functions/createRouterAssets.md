# Functions: createRouterAssets()

## Call Signature

```ts
function createRouterAssets<TRouter>(router): RouterAssets<TRouter>;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TRouter` *extends* [`Router`](../types/Router.md) |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `router` | `TRouter` |

### Returns

`RouterAssets`\<`TRouter`\>

## Call Signature

```ts
function createRouterAssets<TRouter>(routerKey): RouterAssets<TRouter>;
```

### Type Parameters

| Type Parameter |
| ------ |
| `TRouter` *extends* [`Router`](../types/Router.md) |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `routerKey` | `InjectionKey`\<`TRouter`\> |

### Returns

`RouterAssets`\<`TRouter`\>
