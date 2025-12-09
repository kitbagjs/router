# Types: CreatedRouteOptions

```ts
type CreatedRouteOptions = Omit<CreateRouteOptions, "props"> & WithHooks & object;
```

The Route properties originally provided to `createRoute`. The only change is normalizing meta to always default to an empty object.

## Type Declaration

### id

```ts
id: string;
```

### props?

```ts
optional props: unknown;
```
