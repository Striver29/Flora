/**
 * Live HTTP client — same interface as mockClient, backed by the Express API.
 * Not implemented until the API phase; every method throws so accidental use
 * with EXPO_PUBLIC_API_MODE=live fails loudly instead of silently.
 */
const notImplemented = (method) => async () => {
  throw new Error(
    `liveClient.${method} is not implemented yet — the Express API lands in a later phase`,
  );
};

export const liveClient = {
  auth: {
    signup: notImplemented('auth.signup'),
    login: notImplemented('auth.login'),
    logout: notImplemented('auth.logout'),
    me: notImplemented('auth.me'),
  },
  me: {
    update: notImplemented('me.update'),
  },
  species: {
    list: notImplemented('species.list'),
    search: notImplemented('species.search'),
    get: notImplemented('species.get'),
  },
  plants: {
    list: notImplemented('plants.list'),
    get: notImplemented('plants.get'),
    create: notImplemented('plants.create'),
    markWatered: notImplemented('plants.markWatered'),
    timeline: notImplemented('plants.timeline'),
    logs: {
      create: notImplemented('plants.logs.create'),
    },
  },
  schedules: {
    list: notImplemented('schedules.list'),
    create: notImplemented('schedules.create'),
  },
  diagnoses: {
    create: notImplemented('diagnoses.create'),
    get: notImplemented('diagnoses.get'),
    attach: notImplemented('diagnoses.attach'),
    escalate: notImplemented('diagnoses.escalate'),
  },
  feed: {
    list: notImplemented('feed.list'),
  },
  users: {
    get: notImplemented('users.get'),
    posts: notImplemented('users.posts'),
  },
  posts: {
    list: notImplemented('posts.list'),
    get: notImplemented('posts.get'),
    create: notImplemented('posts.create'),
    comments: notImplemented('posts.comments'),
    like: notImplemented('posts.like'),
    unlike: notImplemented('posts.unlike'),
    comment: notImplemented('posts.comment'),
  },
  social: {
    follow: notImplemented('social.follow'),
    unfollow: notImplemented('social.unfollow'),
  },
  devices: {
    register: notImplemented('devices.register'),
  },
};
