import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '3krwldhr',
    dataset: 'production',
  },
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
  typegen: {
    enabled: true,
    // Queries live in the Next.js app next door.
    path: '../web/src/**/*.{ts,tsx}',
    schema: 'schema.json',
    generates: '../web/sanity.types.ts',
    overloadClientMethods: true,
  },
})
