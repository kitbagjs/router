# Classes: UnreachableRouteError

An error thrown when a named route's path does not start with `/`.
Url pathnames always start with `/`, so such a route can never match a url.

## Extends

- `Error`

## Constructors

### Constructor

```ts
new UnreachableRouteError(name, path): UnreachableRouteError;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |
| `path` | `string` |

#### Returns

`UnreachableRouteError`

#### Overrides

```ts
Error.constructor
```

## Methods

### isError()

```ts
static isError(error): error is Error;
```

Indicates whether the argument provided is a built-in Error instance or not.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | `unknown` |

#### Returns

`error is Error`

#### Inherited from

```ts
Error.isError
```

## Properties

| Property | Type | Inherited from |
| ------ | ------ | ------ |
| <a id="cause"></a> `cause?` | `unknown` | `Error.cause` |
| <a id="message"></a> `message` | `string` | `Error.message` |
| <a id="name"></a> `name` | `string` | `Error.name` |
| <a id="stack"></a> `stack?` | `string` | `Error.stack` |
