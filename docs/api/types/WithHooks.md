# Types: WithHooks

```ts
type WithHooks = object;
```

Defines route hooks that can be applied before entering, updating, or leaving a route, as well as after these events.

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
