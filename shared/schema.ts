import { z } from "zod";

export const DestinationUrlSchema = z.string()
  .trim()
  .min(1)
  .max(999)
  .pipe(z.url({ protocol: /^https?$/ }))

export const ShortenRequestSchema = z.object({
  url: DestinationUrlSchema
})

export const UsernameSchema = z.string()
  .min(1)
  .max(63)
  .regex(/^[A-Za-z0-9_-]+$/)

export const HashSchema = z.base64()
  .transform(value => Uint8Array.fromBase64(value))
  .refine(
    bytes => bytes.byteLength == 32,
    "Hash must decode to 32 bytes"
  )

export const SaltSchema = z.base64()
  .refine(
    value => Uint8Array.fromBase64(value).byteLength == 16,
    "Salt must decode to 16 bytes"
  )

export const LoginRequestSchema = z.object({
  username: UsernameSchema,
  hash: HashSchema
})

export const CreateAccountRequestSchema = LoginRequestSchema.extend({
  salt: SaltSchema
})

export const HashInformationQuerySchema = z.object({
  username: UsernameSchema
})

export const ShortCodeParamsSchema = z.object({
  code: z.string()
    .min(2) // 2 charaxters for id 1
    .max(11) // 11 characters for Number.MAX_SAFE_INTEGER
    .regex(/^[A-Za-z0-9_-]+$/)
})

export const UrlsQuerySchema = z.object({
  page: z.string()
    .regex(/^\d+$/, "Pager must be a nonnegative integer")
    .transform(Number)
    .pipe(z.number().int().nonnegative().max(
      Math.floor(Number.MAX_SAFE_INTEGER / 50)
    ))
    .default(0)
})