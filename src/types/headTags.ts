export type HeadTagName = 'title' | 'meta' | 'link'

export type HeadElement = Readonly<{
  tag: HeadTagName,
  attributes: Readonly<Partial<Record<string, string>>>,
  textContent?: string,
}>

/** Supplied attributes narrow a match; omitted attributes do not constrain it. */
export type HeadSelector = Readonly<{
  tag: HeadTagName,
  attributes: Readonly<Partial<Record<string, string>>>,
}>

/** An image and its structured properties stay together when a layer replaces or removes it. */
export type HeadGroup = Readonly<{
  selector: HeadSelector,
  elements: readonly HeadElement[],
}>

export type HeadOperation = | Readonly<{
  kind: 'set' | 'add',
  target: HeadSelector,
  groups: readonly HeadGroup[],
}>
| Readonly<{
  kind: 'delete',
  target: HeadSelector,
}>

/** Operations are retained instead of a flattened head so removing a layer reveals current lower values. */
export type HeadLayer = readonly HeadOperation[]

export type HeadMetaSelector = {
  media?: string,
  key?: string,
}

export type HeadMetaContent = HeadMetaSelector & {
  content: string,
}

export type HeadMetaIdentifier = | { name: string, property?: never }
  | { property: string, name?: never }

export type HeadMetaDescriptor = HeadMetaIdentifier & HeadMetaContent

export type HeadMedia = {
  url: string,
  secureUrl?: string,
  type?: string,
  key?: string,
}

export type HeadImage = HeadMedia & {
  alt?: string,
  width?: number,
  height?: number,
}

export type HeadMetaValue<TName extends string> = TName extends 'og:image' | 'og:video'
  ? string | HeadImage
  : TName extends 'og:audio'
    ? string | HeadMedia
    : string | HeadMetaContent

export type HeadMetaMethod = {
  <TName extends string>(name: TName, value: HeadMetaValue<TName> | readonly HeadMetaValue<TName>[]): void,
  (descriptor: HeadMetaDescriptor): void,
}

export type HeadMetaDelete = {
  (name: string, selector?: HeadMetaSelector): void,
  (selector: HeadMetaIdentifier & HeadMetaSelector): void,
}

export type HeadLinkSelector = {
  rel: string,
  type?: string,
  sizes?: string,
  media?: string,
  hreflang?: string,
  href?: string,
  key?: string,
}

export type HeadLink = HeadLinkSelector & {
  href: string,
  as?: string,
  crossorigin?: '' | 'anonymous' | 'use-credentials',
  integrity?: string,
  referrerpolicy?: ReferrerPolicy,
  fetchpriority?: 'high' | 'low' | 'auto',
  color?: string,
}

export type HeadTags = {
  title: {
    set: (value: string) => void,
    delete: () => void,
  },
  meta: {
    set: HeadMetaMethod,
    add: HeadMetaMethod,
    delete: HeadMetaDelete,
  },
  link: {
    set: (value: HeadLink) => void,
    add: (value: HeadLink) => void,
    delete: (selector: HeadLinkSelector) => void,
  },
}
