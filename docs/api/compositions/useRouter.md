# Compositions: useRouter()

```ts
const useRouter: () => Router;
```

A composition to access the installed router instance within a Vue component.

## Returns

[`Router`](../types/Router.md)

The installed router instance.

## Throws

Throws an error if the router has not been installed,
        ensuring the component does not operate without routing functionality.
