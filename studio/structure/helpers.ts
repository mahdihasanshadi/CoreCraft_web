import type {ComponentType} from 'react'
import type {StructureBuilder, StructureResolverContext} from 'sanity/structure'

export const API_VERSION = '2026-10-04'

/**
 * True when the signed-in user holds any of the named project roles.
 * Built-in role names are "administrator", "editor" and "viewer".
 */
export function hasAnyRole(context: StructureResolverContext, roleNames: readonly string[]): boolean {
  const roles = context.currentUser?.roles ?? []
  return roles.some((role) => roleNames.includes(role.name))
}

/** A list item that opens one fixed document, so only one can ever exist. */
export function singletonItem(
  S: StructureBuilder,
  options: {type: string; title: string; icon?: ComponentType},
) {
  return S.listItem()
    .id(options.type)
    .title(options.title)
    .icon(options.icon)
    .child(S.document().schemaType(options.type).documentId(options.type).title(options.title))
}

/**
 * A filtered document list that still knows which type it shows, and which
 * create templates its "New" button should offer.
 */
export function filteredList(
  S: StructureBuilder,
  options: {
    id: string
    title: string
    schemaType: string
    filter: string
    params?: Record<string, unknown>
    icon?: ComponentType
    defaultOrdering?: {field: string; direction: 'asc' | 'desc'}[]
    /** Initial value template IDs offered by the list's create button. */
    templates?: readonly string[]
  },
) {
  let list = S.documentList()
    .id(options.id)
    .title(options.title)
    .schemaType(options.schemaType)
    .filter(options.filter)
    .apiVersion(API_VERSION)

  if (options.params) list = list.params(options.params)
  if (options.defaultOrdering) list = list.defaultOrdering(options.defaultOrdering)
  if (options.templates) {
    list = list.initialValueTemplates(
      options.templates.map((templateId) => S.initialValueTemplateItem(templateId)),
    )
  }

  return S.listItem().id(options.id).title(options.title).icon(options.icon).child(list)
}
