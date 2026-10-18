import { text as uiText } from "@/config/brand";
import { z } from "zod";
export const identitySchema = z
  .string()
  .trim()
  .min(1, uiText("validation.enter_an_email_or_phone_number"))
  .refine(
    (v) =>
      z.string().email().safeParse(v).success ||
      /^\+?[0-9][0-9\s-]{7,17}$/.test(v),
    uiText("validation.use_a_valid_email_or_phone_number"),
  );
export const loginSchema = z.object({
  identity: identitySchema,
  password: z.string().min(8, uiText("validation.use_at_least_8_characters")),
});
export const registerSchema = loginSchema.extend({
  password: z.string().min(12, "Use at least 12 characters.").regex(/[a-z]/, "Include a lowercase letter.").regex(/[A-Z]/, "Include an uppercase letter.").regex(/[0-9]/, "Include a number.").regex(/[^A-Za-z0-9]/, "Include a symbol."),
  age: z.literal(true, {
    errorMap: () => ({
      message: uiText("validation.you_must_be_18_or_older_to"),
    }),
  }),
  consent: z.literal(true, {
    errorMap: () => ({
      message: uiText("validation.accept_the_terms_and_privacy_notice_to"),
    }),
  }),
});
export function ageFromDate(value: string, now = new Date()) {
  const birth = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birth.getTime()) || birth > now) return 0;
  let age = now.getFullYear() - birth.getFullYear();
  if (
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  )
    age--;
  return age;
}
export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, uiText("validation.use_at_least_2_characters"))
    .max(40),
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(
      /^[a-zA-Z0-9_.]+$/,
      uiText("validation.use_letters_numbers_dots_or_underscores"),
    ),
  bio: z
    .string()
    .max(240, uiText("validation.keep_your_bio_under_240_characters")),
});
export async function readPhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new Error(uiText("validation.choose_a_jpg_png_or_webp_image"));
  if (file.size > 5 * 1024 * 1024)
    throw new Error(uiText("validation.choose_an_image_smaller_than_5_mb"));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(new Error(uiText("validation.could_not_read_this_image")));
    reader.readAsDataURL(file);
  });
}
