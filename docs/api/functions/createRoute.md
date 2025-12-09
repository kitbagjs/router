# Functions: createRoute()

```ts
function createRoute<TOptions, TProps>(options, ...args): ToRoute<TOptions, CreateRouteProps<TOptions> extends TProps ? undefined : TProps>;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TOptions` *extends* [`CreateRouteOptions`](../types/CreateRouteOptions.md) |
| `TProps` *extends* \| [`PropsGetter`](../types/PropsGetter.md)\<`TOptions`, `any`\[`any`\]\> \| `RoutePropsRecord`\<`TOptions`, `any`\[`any`\]\> \| [`PropsGetter`](../types/PropsGetter.md)\<`TOptions`, `DefineSetupFnComponent`\<`RouterViewProps`, `EmitsOptions`, `SlotsType`\<`RouterViewSlots`\>, `RouterViewProps` & \| \{ \[`x`: `` `on${Capitalize<string>}` ``\]: (...`args`) => `any` \| `undefined`; \} \| \{ \[`x`: `` `on${Capitalize<string>}` ``\]: (...`args`) => `any` \| `undefined`; \}, `PublicProps`\>\> |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `TOptions` |
| ...`args` | `CreateRouteWithProps`\<`TOptions`, `TProps`\> |

## Returns

[`ToRoute`](../types/ToRoute.md)\<`TOptions`, [`CreateRouteProps`](../types/CreateRouteProps.md)\<`TOptions`\> *extends* `TProps` ? `undefined` : `TProps`\>
