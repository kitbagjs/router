# Functions: createRoute()

```ts
function createRoute<TOptions, TProps>(options, ...args): ToRoute<TOptions, CreateRouteProps<TOptions> extends TProps ? undefined : TProps>;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TOptions` *extends* [`CreateRouteOptions`](../types/CreateRouteOptions.md)\<`undefined` \| `string`, \| `undefined` \| `string` \| `WithParams`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, \| `undefined` \| `string` \| `WithParams`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, \| `undefined` \| `string` \| `WithParams`\<`string`, `Record`\<`string`, `undefined` \| [`Param`](../types/Param.md)\>\>, `Record`\<`string`, `unknown`\>\> |
| `TProps` *extends* \| `PropsGetter`\<`TOptions`, `any`\[`any`\]\> \| `RoutePropsRecord`\<`TOptions`, `any`\[`any`\]\> \| `PropsGetter`\<`TOptions`, `DefineSetupFnComponent`\<`RouterViewProps`, `EmitsOptions`, `SlotsType`\<\{ `default?`: (`props`) => `VNode`; \}\>, `any`, `PublicProps`\>\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `TOptions` |
| ...`args` | `CreateRouteWithProps`\<`TOptions`, `TProps`\> |

## Returns

`ToRoute`\<`TOptions`, `CreateRouteProps`\<`TOptions`\> *extends* `TProps` ? `undefined` : `TProps`\>
