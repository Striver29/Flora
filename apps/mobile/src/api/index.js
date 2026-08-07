import { liveClient } from './liveClient.js';
import { mockClient } from './mockClient.js';

/**
 * Flora data client — the ONLY gateway mobile screens may use (screens never
 * call fetch directly). Selected by EXPO_PUBLIC_API_MODE: 'mock' (default) or 'live'.
 *
 * Every method is async and resolves to an ApiResponse envelope from @flora/shared:
 * `{ ok: true, data }` on success, `{ ok: false, error: { code, message } }` on failure
 * (codes come from ErrorCode: VALIDATION, UNAUTHORIZED, NOT_FOUND, RATE_LIMITED,
 * PROVIDER_ERROR, INTERNAL).
 *
 * Interface:
 *
 *   auth.signup({ username, password })            → { user }        SignupSchema; starts a session
 *   auth.login({ username, password })             → { user }
 *   auth.logout()                                  → null
 *   auth.me()                                      → { user } | null
 *
 *   me.update({ climateZone })                     → { user }        UpdateMeSchema
 *
 *   species.list()                                 → SpeciesDto[]
 *   species.search(query)                          → SpeciesDto[]    common/scientific substring match
 *   species.get(id)                                → SpeciesDto
 *
 *   plants.list()                                  → Plant[]         session user's plants
 *   plants.get(id)                                 → Plant + { schedules, growthLogs }
 *   plants.create(input)                           → Plant           CreatePlantSchema
 *   plants.markWatered(id)                         → { plantId, wateredAt, nextDueAt }
 *                                                     nextDueAt = now + max(1, round(
 *                                                     species.waterEveryDays × zoneMultiplier(user.climateZone))) days
 *   plants.logs.create(plantId, { photoKey?, note? }) → GrowthLog
 *   plants.timeline(plantId, { cursor?, limit? })  → { items, nextCursor }
 *                                                     'log' and completed 'diagnosis' items, newest first
 *
 *   schedules.list(plantId)                        → Schedule[]
 *   schedules.create(plantId, input)               → Schedule        CreateScheduleSchema
 *
 *   diagnoses.create({ plantId?, imageUri, mode? }) → { id, status: 'PENDING' }  mode: 'identify' | 'health'
 *   diagnoses.get(id)                              → Diagnosis       flips to COMPLETE after ~3s;
 *                                                     lowConfidence: true when confidence < 0.55
 *   diagnoses.escalate(id)                         → Post            HELP post embedding
 *                                                     { imageUri, topIssue, confidence }
 *
 *   posts.list({ type? })                          → Post[]
 *   posts.get(id)                                  → Post + { comments }
 *   posts.create(input)                            → Post            CreatePostSchema
 *   posts.like(id) / posts.unlike(id)              → { likeCount }
 *   posts.comment(postId, body)                    → Comment
 *
 *   social.follow(userId) / social.unfollow(userId) → { following }
 *
 *   devices.register(input)                        → { registered: true }  RegisterDeviceSchema
 *
 * Mock-only helpers (absent on the live client):
 *   setNextDiagnosisFixture('healthy-basil' | 'diseased-tomato' | 'blurry'), reset()
 */
export const client = process.env.EXPO_PUBLIC_API_MODE === 'live' ? liveClient : mockClient;
