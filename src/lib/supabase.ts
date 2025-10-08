// Supabase désactivé - utilisation de PostgreSQL uniquement
// Mock Supabase client pour éviter les erreurs
const mockSupabase = {
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => ({ data: null, error: null }),
        maybeSingle: () => ({ data: null, error: null })
      }),
      order: () => ({
        limit: () => ({
          single: () => ({ data: null, error: null })
        })
      })
    }),
    insert: () => ({ data: null, error: null }),
    update: () => ({ data: null, error: null }),
    delete: () => ({ data: null, error: null }),
    auth: {
      getSession: () => ({ data: { session: null } }),
      getUser: () => ({ data: { user: null } }),
      refreshSession: () => ({ data: { session: null } })
    },
    functions: {
      invoke: () => ({ data: null, error: null })
    },
    storage: null
  })
};

export const supabase = mockSupabase;
export const supabaseAdmin = mockSupabase;
export const isSupabaseConfigured = () => false;
export const createStorageClient = () => null;
export const handleTokenRefresh = async () => null;
export const handleAuthStateChange = async () => null;
export const checkSession = async () => null;
export const refreshSession = async () => null;
