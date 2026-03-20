export const ROUTES = {
  auth: {
    login: '/auth/login',
  },
  user: {
    root: '/user/(tabs)/dashboard',
    dashboard: '/user/(tabs)/dashboard',
    calendar: '/user/(tabs)/calendar',
    settings: '/user/settings',
  },
  admin: {
    root: '/admin/(tabs)/calendar',
    calendar: '/admin/(tabs)/calendar',
    users: '/admin/(tabs)/users',
    createSession: '/admin/session/create',
    editSession: (sessionId: string) => `/admin/session/${sessionId}/edit`,
    createUser: '/admin/user/create',
    editUser: (uid: string) => `/admin/user/${uid}/edit`,
  },
  modal: {
    sessionDetail: (sessionId: string) => `/modal/session/${sessionId}`,
  },
} as const;
