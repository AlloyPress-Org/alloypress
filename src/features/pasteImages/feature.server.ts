import { createServerFeature } from '@payloadcms/richtext-lexical'

export const PasteImagesFeature = createServerFeature({
  key: 'pasteImages',
  feature: {
    ClientFeature: '/features/pasteImages/feature.client#PasteImagesClientFeature',
  },
})