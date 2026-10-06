import { z } from 'zod';

export const publicStoreContactSchema = z.object({
  phone: z.string(),
  secondaryPhone: z.string().optional(),
  address: z.string().optional(),
  mapUrl: z.string().optional(),
  mapQrImage: z.string().optional(),
  /** Exact pin for the embedded map (a short maps link can't be embedded). */
  geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
  /** Display text only, e.g. "15:00 – 23:00 hằng ngày". Not enforced. */
  openingHours: z.string().optional(),
  zalo: z.string().optional(),
  facebook: z.string().optional(),
});

export const publicStoreBrandingSchema = z.object({
  logo: z.string().optional(),
  tagline: z.string().optional(),
  coverImage: z.string().optional(),
});

export const publicStorePaymentSchema = z.object({
  qrImage: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  accountName: z.string().optional(),
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
