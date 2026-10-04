import {defineConfig, type DocumentActionComponent, type Template, type Tool} from 'sanity'
import {presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'

import {AdvanceOrderAction, CashCollectedAction} from './actions/order-actions'
import {FulfilmentStatusBadge, PaymentStatusBadge} from './badges/order-badges'
import {resolve} from './presentation/resolve'
import {commerceTypes, contentTypes} from './schemaTypes'
import {commerceStructure} from './structure/commerce'
import {contentDefaultDocumentNode, contentStructure} from './structure/content'
import {productTemplates} from './templates'
import {overviewTool} from './tools/overview'

const projectId = '3krwldhr'
const previewOrigin = process.env.SANITY_STUDIO_PREVIEW_ORIGIN ?? 'http://localhost:3000'

/** Fixed-ID documents that must never be created twice or deleted. */
const SINGLETONS = ['siteSettings']

/** Types the storefront writes. Editors can edit them, not create them by hand. */
const STOREFRONT_ONLY = ['productInterest']

const LOCKED_SINGLETON_ACTIONS = new Set(['delete', 'duplicate', 'unpublish'])

/** Vision is a GROQ console for developers; editors never need it. */
function adminOnlyVision(tools: Tool[], {currentUser}: {currentUser: {roles: {name: string}[]} | null}) {
  const isAdmin = currentUser?.roles.some((role) => role.name === 'administrator') ?? false
  return isAdmin ? tools : tools.filter((tool) => tool.name !== 'vision')
}

function hideFromCreateMenu(templates: Template[], hidden: string[]) {
  return templates.filter((template) => !hidden.includes(template.schemaType))
}

/**
 * Two workspaces, one Studio.
 *
 * "Content" is the public catalogue on the `production` dataset. "Commerce"
 * is the private `commerce` dataset holding orders, customers and enquiries.
 * Keeping them in separate datasets is what lets the storefront read the
 * catalogue without a token while personal data stays locked.
 */
export default defineConfig([
  {
    name: 'content',
    title: 'CoreCraft · Content',
    subtitle: 'Products, collections, services',
    basePath: '/content',
    projectId,
    dataset: 'production',
    plugins: [
      structureTool({
        structure: contentStructure,
        defaultDocumentNode: contentDefaultDocumentNode,
      }),
      presentationTool({
        resolve,
        previewUrl: {
          origin: previewOrigin,
          previewMode: {enable: '/api/draft-mode/enable'},
        },
      }),
      visionTool({defaultApiVersion: '2026-10-04'}),
    ],
    tools: adminOnlyVision,
    schema: {
      types: contentTypes,
      templates: (templates) => [...hideFromCreateMenu(templates, SINGLETONS), ...productTemplates],
    },
    document: {
      actions: (actions, {schemaType}) =>
        SINGLETONS.includes(schemaType)
          ? actions.filter(
              (action: DocumentActionComponent) =>
                !action.action || !LOCKED_SINGLETON_ACTIONS.has(action.action),
            )
          : actions,
    },
  },
  {
    name: 'commerce',
    title: 'CoreCraft · Commerce',
    subtitle: 'Orders, enquiries, customers',
    basePath: '/commerce',
    projectId,
    dataset: 'commerce',
    plugins: [structureTool({structure: commerceStructure}), visionTool({defaultApiVersion: '2026-10-04'})],
    // Overview first, so the workspace opens on today's numbers.
    tools: (tools, context) => [overviewTool, ...adminOnlyVision(tools, context)],
    schema: {
      types: commerceTypes,
      templates: (templates) => hideFromCreateMenu(templates, STOREFRONT_ONLY),
    },
    document: {
      badges: (badges, {schemaType}) =>
        schemaType === 'order' ? [PaymentStatusBadge, FulfilmentStatusBadge, ...badges] : badges,
      actions: (actions, {schemaType, currentUser}) => {
        if (schemaType !== 'order') return actions
        const isAdmin = currentUser?.roles.some((role) => role.name === 'administrator') ?? false
        // Orders are records: editors cancel them, only administrators may delete.
        const kept = isAdmin ? actions : actions.filter((action) => action.action !== 'delete')
        return [CashCollectedAction, AdvanceOrderAction, ...kept]
      },
    },
  },
])
