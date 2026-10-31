import type { LinkBase, Meta } from 'zhead'

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

/** A primary tag and its related tags are replaced or removed together. */
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

export type HeadMetaIdentifier = | {
  name: NonNullable<Meta['name']>,
  property?: never,
}
| {
  property: NonNullable<Meta['property']>,
  name?: never,
}

export type HeadMetaSelector = HeadMetaIdentifier & Pick<Meta, 'media' | 'id'> & {
  key?: string,
}

export type HeadMetaDescriptor = HeadMetaSelector & Pick<Meta, 'content'> & {
  content: NonNullable<Meta['content']>,
  related?: readonly HeadMetaDescriptor[],
}

export type HeadLinkSelector = Pick<LinkBase, 'type' | 'sizes' | 'media' | 'hreflang' | 'href' | 'id'> & {
  rel: NonNullable<LinkBase['rel']>,
  key?: string,
}

export type HeadLink = LinkBase & HeadLinkSelector & {
  href: string,
  related?: readonly HeadLink[],
}

export type HeadTags = {
  title: {
    set: (value: string) => void,
    delete: () => void,
  },
  meta: {
    set: (descriptor: HeadMetaDescriptor) => void,
    add: (descriptor: HeadMetaDescriptor) => void,
    delete: (selector: HeadMetaSelector) => void,
  },
  link: {
    set: (descriptor: HeadLink) => void,
    add: (descriptor: HeadLink) => void,
    delete: (selector: HeadLinkSelector) => void,
  },
}
