# host

```ts
function host<THost, TParams>(host, params): Host<THost, TParams>
```

Constructs a Host object, which enables assigning types for params.

## Type parameters

| Type parameter | Description |
| :------ | :------ |
| `THost` *extends* `string` | The string literal type that represents the host. |
| `TParams` *extends* `HostParams`\<`THost`\> | The type of the host parameters associated with the host. |

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `host` | `THost` | The host string. |
| `params` | `Identity`\<`TParams`\> | The parameters associated with the host, typically as key-value pairs. |

## Returns

`Host`\<`THost`, `TParams`\>

An object representing the host which includes the host string, its parameters, and a toString method for getting the host as a string.

## Example

```ts
import { createExternalRoute, host } from '@kitbag/router'

export const docs = createExternalRoute({
  name: 'home',
  host: host('https://[subdomain].kitbag.dev', { subdomain: String })
})
```

## Custom Params

Param types is customizable with [`ParamGetter`](/api/types/ParamGetter), [`ParamSetter`](/api/types/ParamSetter), and [`ParamGetSet`](/api/types/ParamGetSet). Read more about [custom params](/core-concepts/route-params#custom-param).
