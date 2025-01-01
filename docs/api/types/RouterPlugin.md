# Types: RouterPlugin\<TRoutes, TRejections\>

```ts
type RouterPlugin<TRoutes, TRejections> = object;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TRoutes` *extends* [`Routes`](Routes.md) | [`Routes`](Routes.md) |
| `TRejections` *extends* `Record`\<`string`, `Component`\> | `Record`\<`string`, `Component`\> |

## Type declaration

### onAfterRouteEnter?

```ts
optional onAfterRouteEnter: MaybeArray<AfterRouteHook>;
```

### onAfterRouteLeave?

```ts
optional onAfterRouteLeave: MaybeArray<AfterRouteHook>;
```

### onAfterRouteUpdate?

```ts
optional onAfterRouteUpdate: MaybeArray<AfterRouteHook>;
```

### onBeforeRouteEnter?

```ts
optional onBeforeRouteEnter: MaybeArray<BeforeRouteHook>;
```

### onBeforeRouteLeave?

```ts
optional onBeforeRouteLeave: MaybeArray<BeforeRouteHook>;
```

### onBeforeRouteUpdate?

```ts
optional onBeforeRouteUpdate: MaybeArray<BeforeRouteHook>;
```

### rejections

```ts
rejections: TRejections;
```

### routes

```ts
routes: TRoutes;
```
