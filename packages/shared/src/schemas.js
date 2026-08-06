import { z } from 'zod';

/** Payload for POST /auth/signup. */
export const SignupSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'lowercase letters, digits and underscores only'),
  password: z.string().min(8),
});

/** Payload for POST /plants. */
export const CreatePlantSchema = z.object({
  nickname: z.string().min(1),
  speciesId: z.string().optional(),
  photoKey: z.string().optional(),
});

/** Payload for POST /plants/:id/schedules. */
export const CreateScheduleSchema = z.object({
  type: z.enum(['WATER', 'FERTILIZE', 'SEASONAL']),
  intervalDays: z.number().int().min(1).optional(),
});

/** Payload for POST /posts — requires a text body, at least one image, or both. */
export const CreatePostSchema = z
  .object({
    body: z.string().optional(),
    images: z.array(z.string()).optional(),
  })
  .refine((post) => Boolean(post.body?.trim()) || (post.images?.length ?? 0) > 0, {
    message: 'A post needs a body or at least one image',
    path: ['body'],
  });

/** Payload for POST /devices — registers a push-notification token. */
export const RegisterDeviceSchema = z.object({
  pushToken: z.string().min(1),
  platform: z.enum(['android', 'ios']),
});
