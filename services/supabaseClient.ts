import { createClient } from '@supabase/supabase-js';

// 1. Configuration pour Vite (Utilise import.meta.env)
// Ces noms doivent correspondre exactement à ce que vous avez mis sur Vercel
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. Détection du mode Production
// On vérifie que les clés existent et commencent par http
const isProduction = !!(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http'));

// 3. Client Supabase Réel
const realClient = isProduction 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

// --- Système de Mock (Données de test locales) ---
const mockStorage = {
  get: (table: string) => {
    try {
      return JSON.parse(localStorage.getItem(`abf_mock_${table}`) || '[]');
    } catch { return []; }
  },
  set: (table: string, data: any[]) => localStorage.setItem(`abf_mock_${table}`, JSON.stringify(data)),
  add: (table: string, item: any) => {
    const data = mockStorage.get(table);
    const newItem = { 
      ...item, 
      id: item.id || Math.random().toString(36).substr(2, 9), 
      created_at: new Date().toISOString() 
    };
    const existsIndex = data.findIndex((d: any) => d.id === newItem.id);
    if (existsIndex >= 0) {
      data[existsIndex] = { ...data[existsIndex], ...newItem };
    } else {
      data.push(newItem);
    }
    mockStorage.set(table, data);
    return newItem;
  }
};

// 4. Export du Client Hybride (Bascule entre Réel et Mock)
export const supabase = {
  auth: {
    signUp: async (creds: any) => {
      if (realClient) return realClient.auth.signUp(creds);
      const user = { id: 'mock-user-' + Date.now(), email: creds.email || '', phone: creds.phone || '' };
      return { data: { user, session: { access_token: 'mock-jwt', user } }, error: null };
    },
    signInWithPassword: async (creds: any) => {
      if (realClient) return realClient.auth.signInWithPassword(creds);
      const user = { id: 'mock-user-id', email: creds.email };
      return { data: { user, session: { access_token: 'mock-jwt', user } }, error: null };
    },
    signOut: async () => {
      if (realClient) return realClient.auth.signOut();
      return { error: null };
    },
    getSession: async () => {
      if (realClient) return realClient.auth.getSession();
      return { data: { session: null }, error: null };
    }
  },
  from: (table: string) => {
    if (realClient) return realClient.from(table);

    // Mock Query Builder
    let queryData = mockStorage.get(table);
    return {
      select: (columns: string = '*') => ({
        eq: (col: string, val: any) => ({
          single: async () => ({ data: queryData.find((row: any) => row[col] === val) || null, error: null }),
          order: (col: string, { ascending = true } = {}) => ({
            then: (resolve: any) => resolve({ data: queryData, error: null })
          }),
          then: (resolve: any) => resolve({ data: queryData.filter((row: any) => row[col] === val), error: null })
        }),
        order: (col: string, { ascending = true } = {}) => ({
          limit: (n: number) => ({
            then: (resolve: any) => resolve({ data: queryData.slice(0, n), error: null })
          }),
          then: (resolve: any) => resolve({ data: queryData, error: null })
        }),
        then: (resolve: any) => resolve({ data: queryData, error: null })
      }),
      insert: async (data: any) => ({ data: mockStorage.add(table, data), error: null }),
      update: (data: any) => ({
        eq: async (col: string, val: any) => {
          const items = mockStorage.get(table);
          const updated = items.map((i: any) => i[col] === val ? { ...i, ...data } : i);
          mockStorage.set(table, updated);
          return { data, error: null };
        }
      }),
      upsert: async (data: any) => ({ data: mockStorage.add(table, data), error: null }),
    };
  }
};
