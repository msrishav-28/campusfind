import { z } from "zod";
import { ITEM_CATEGORIES } from "@/lib/types";

const categoryEnum = z.enum(ITEM_CATEGORIES);

export const createItemSchema = z.object({
  type: z.enum(["lost", "found"]),
  title: z.string().trim().min(1),
  category: categoryEnum.default("other"),
  lat: z.number(),
  lng: z.number(),
  accuracyM: z.number().nonnegative().nullable().optional(),
  placeId: z.string().nullable().optional(),
  placeLabel: z.string().nullable().optional(),
  source: z.enum(["gps_snap", "gps_raw", "picked", "dragged"]).optional(),
  floor: z.number().int().nullable().optional(),
  note: z.string().max(40).nullable().optional(),
  transcript: z.string().nullable().optional(),
  secret: z.string().nullable().optional(),
  photoPath: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  color: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
});

export const reportSchema = z.object({
  reason: z.enum(["spam", "inappropriate", "wrong", "other"]),
});

export const claimSchema = z.object({
  secret: z.string().nullable().optional(),
  message: z.string().max(200).nullable().optional(),
});

export const otpStartSchema = z.object({
  phone: z.string().trim().min(6).optional(),
  email: z.string().email().optional(),
}).refine((value) => Boolean(value.phone || value.email), {
  message: "Provide phone or email",
});

export const otpVerifySchema = z.object({
  challengeId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
});
