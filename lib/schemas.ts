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

export const campusOnboardSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, "Slug may only contain lowercase letters, numbers, and hyphens")
    .min(3, "Slug must be at least 3 characters")
    .max(30, "Slug must be 30 characters or fewer"),
  name: z.string().trim().min(3, "Institution name must be at least 3 characters").max(100),
  institutionType: z.enum(["college", "university", "school", "other"]).default("college"),
  city: z.string().trim().min(2, "City name is required").max(60),
  contactEmail: z.string().email("Valid institutional contact email required"),
  contactPhone: z.string().trim().min(8, "Valid contact phone number required").max(15),
  deskPin: z.string().trim().min(4, "Desk security PIN must be at least 4 digits").max(10).default("1234"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  fenceM: z.number().positive().max(5000).default(700),
});

