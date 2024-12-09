# Errors: RouterNotInstalledError

An error thrown when an attempt is made to use routing functionality before the router has been installed.

## Extends

- `Error`

## Constructors

### new RouterNotInstalledError()

```ts
new RouterNotInstalledError(): RouterNotInstalledError
```

#### Returns

[`RouterNotInstalledError`](RouterNotInstalledError.md)

#### Overrides

`Error.constructor`

## Methods

### captureStackTrace()

```ts
static captureStackTrace(targetObject, constructorOpt?): void
```

Create .stack property on a target object

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `targetObject` | `object` |
| `constructorOpt`? | `Function` |

#### Returns

`void`

#### Inherited from

`Error.captureStackTrace`

## Properties

| Property | Modifier | Type | Description | Inherited from |
| ------ | ------ | ------ | ------ | ------ |
| `message` | `public` | `string` | - | `Error.message` |
| `name` | `public` | `string` | - | `Error.name` |
| `stack?` | `public` | `string` | - | `Error.stack` |
| `prepareStackTrace?` | `static` | (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any` | Optional override for formatting stack traces **See** https://v8.dev/docs/stack-trace-api#customizing-stack-traces | `Error.prepareStackTrace` |
| `stackTraceLimit` | `static` | `number` | - | `Error.stackTraceLimit` |
