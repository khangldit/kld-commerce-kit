import { z } from 'zod';

export const publicStoreContactSchema = z.object({
  phone: z.string(),
  address: z.string().optional(),
  mapUrl: z.string().optional(),
  mapQrImage: z.string().optional(),
});

export const publicStoreBrandingSchema = z.object({
  logo: z.string().optional(),
});

export const publicStorePaymentSchema = z.object({
  qrImage: z.string().optional(),
});

export const publicStoreSchema = z.object({
  slug: z.string(),
  name: z.string(),
  contact: publicStoreContactSchema,
  branding: publicStoreBrandingSchema,
  payment: publicStorePaymentSchema,
});

export type PublicStoreContact = z.infer<typeof publicStoreContactSchema>;
export type PublicStoreBranding = z.infer<typeof publicStoreBrandingSchema>;
export type PublicStorePayment = z.infer<typeof publicStorePaymentSchema>;
export type PublicStore = z.infer<typeof publicStoreSchema>;
