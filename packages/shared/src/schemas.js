import { z } from 'zod';
import { IssueCodes } from './issues.js';

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

/** Lebanese climate zones used to tune care schedules. */
export const ClimateZones = Object.freeze(['COASTAL', 'MOUNTAIN', 'BEKAA', 'SOUTH']);

/** Payload for PATCH /me — profile updates from the mobile app. */
export const UpdateMeSchema = z.object({
  climateZone: z.enum(ClimateZones),
});

/** How a photo should be read: name the plant, or judge its health. */
export const DiagnosisModes = Object.freeze(['identify', 'health']);

/** Terminal and in-flight states of an async diagnosis job. */
export const DiagnosisStatuses = Object.freeze(['PENDING', 'COMPLETE', 'FAILED']);

/** A diagnosis whose confidence falls below this is flagged for a second opinion. */
export const LOW_CONFIDENCE_THRESHOLD = 0.55;

const Probability = z.number().min(0).max(1);

/** One candidate species from the recognition provider. */
export const SpeciesCandidateSchema = z.object({
  speciesId: z.string().optional(),
  scientificName: z.string().min(1),
  commonNames: z.array(z.string()),
  probability: Probability,
});

/** A detected health issue with suggested treatments. */
export const HealthIssueSchema = z.object({
  code: z.enum(IssueCodes),
  name: z.string().min(1),
  probability: Probability,
  treatmentHints: z.array(z.string()),
});

/** Health assessment of a photographed plant. */
export const HealthAssessmentSchema = z.object({
  isHealthy: z.boolean(),
  issues: z.array(HealthIssueSchema),
  confidence: Probability,
});

/**
 * Normalized recognition output. Every provider adapter must produce this
 * shape — it is what the mobile result screen renders.
 */
export const RecognitionResultSchema = z.object({
  species: z.array(SpeciesCandidateSchema),
  health: HealthAssessmentSchema,
});

/**
 * Payload for POST /diagnoses.
 *
 * The image travels as base64 in the request body. That is deliberate but
 * temporary — once the S3 upload path lands this becomes an `imageKey` and the
 * bytes stop passing through the API entirely.
 */
export const CreateDiagnosisSchema = z.object({
  imageBase64: z
    .string()
    .min(1)
    // Accept a `data:image/jpeg;base64,...` URL and keep only the payload, so
    // callers can pass an ImagePicker/Camera result through unmodified.
    .transform((value) => value.replace(/^data:[^;,]*;base64,/, '').trim())
    .refine((value) => value.length > 0, { message: 'imageBase64 is empty' })
    .refine((value) => /^[A-Za-z0-9+/]+={0,2}$/.test(value), {
      message: 'imageBase64 is not valid base64',
    }),
  mode: z.enum(DiagnosisModes).default('identify'),
  plantId: z.string().optional(),
});
