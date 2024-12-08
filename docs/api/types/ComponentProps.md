# Types: ComponentProps\<TComponent\>

```ts
type ComponentProps<TComponent>: TComponent extends Constructor ? InstanceType<TComponent>["$props"] : TComponent extends AsyncComponentLoader<infer T> ? ComponentProps<T> : TComponent extends FunctionalComponent<infer T> ? T : never;
```

## Type Parameters

| Type Parameter |
| ------ |
| `TComponent` *extends* `Component` |
