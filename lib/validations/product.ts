import { z } from 'zod';

export const productSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  categoryId: z.string().min(1),
  specsJson: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  imageUrls: z.array(z.string().url()),
  availabilityText: z.string().min(1),
  visibilityStatus: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  isFeatured: z.boolean(),
});
