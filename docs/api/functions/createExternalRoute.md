# Functions: createExternalRoute()

## Call Signature

```ts
function createExternalRoute<TOptions>(options): ExternalRouteWithMethods<ToRoute<TOptions>, TOptions["context"]>;
```

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-toptions"></a> `TOptions` *extends* [`CreateRouteOptions`](../types/CreateRouteOptions.md) & [`WithHost`](../types/WithHost.md) & [`WithoutParent`](../types/WithoutParent.md) |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `TOptions` |

### Returns

`ExternalRouteWithMethods`\<[`ToRoute`](../types/ToRoute.md)\<`TOptions`\>, `TOptions`\[`"context"`\]\>

## Call Signature

```ts
function createExternalRoute<TOptions>(options): ExternalRouteWithMethods<ToRoute<TOptions>, ExtractRouteContext<TOptions>>;
```

### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-toptions-1"></a> `TOptions` *extends* [`CreateRouteOptions`](../types/CreateRouteOptions.md) & [`WithoutHost`](../types/WithoutHost.md) & [`WithParent`](../types/WithParent.md) |

### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `TOptions` |

### Returns

`ExternalRouteWithMethods`\<[`ToRoute`](../types/ToRoute.md)\<`TOptions`\>, `ExtractRouteContext`\<`TOptions`\>\>
