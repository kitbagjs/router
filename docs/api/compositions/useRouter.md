# Compositions: useRouter()

```ts
function useRouter(): Router;
```

A composition to access the registered router instance within a Vue component.

## Returns

[`Router`](../types/Router.md)

The registered router instance.

## Throws

Throws an error if the router has not been installed,
        ensuring the component does not operate without routing functionality.
