import {defineBlueprint, defineDocumentFunction} from '@sanity/blueprints'

/**
 * Infrastructure for the CoreCraft Sanity project (3krwldhr).
 *
 *   npx sanity blueprints plan     preview changes
 *   npx sanity blueprints deploy   apply them
 *
 * Secrets are never committed here. Add them once per function:
 *   npx sanity functions env add order-notify TELEGRAM_BOT_TOKEN <token>
 *   npx sanity functions env add order-notify TELEGRAM_CHAT_ID <chat id>
 */
export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      name: 'order-notify',
      displayName: 'Order notifications (Telegram)',
      timeout: 15,
      event: {
        on: ['create'],
        filter: '_type == "order"',
        // Orders live in the private commerce dataset, not the catalogue.
        resource: {type: 'dataset', id: '3krwldhr.commerce'},
        projection:
          '{_id, orderNumber, total, currency, customer->{name, phone}, shippingAddress{city, area}, "items": items[]{"name": productName, "variant": variantTitle, quantity}, payment{method}}',
      },
    }),
  ],
})
