
import { createClient } from '@supabase/supabase-js';

// Configuration de l'environnement
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// Détection du mode Production
const isProduction = SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http');

// Client Supabase Réel (activé si clés présentes)
const realClient = isProduction 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

// Système de Mock Persistant (LocalStorage) pour la démo sans backend
const mockStorage = {
  get: (table: string) => {
    try {
      return JSON.parse(localStorage.getItem(`abf_mock_${table}`) || '[]');
    } catch { return []; }
  },
  set: (table: string, data: any[]) => localStorage.setItem(`abf_mock_${table}`, JSON.stringify(data)),
  add: (table: string, item: any) => {
    const data = mockStorage.get(table);
    const newItem = { ...item, id: item.id || Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
    // Check for duplicates based on ID if provided
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

// Client Hybride
export const supabase = {
  auth: {
    signUp: async (creds: any) => {
      if (realClient) return realClient.auth.signUp(creds);
      // Mock signup
      const user = { id: 'mock-user-' + Date.now(), email: creds.email || '', phone: creds.phone || '' };
      return { data: { user, session: { access_token: 'mock-jwt', user } }, error: null };
    },
    signInWithPassword: async (creds: any) => {
      if (realClient) return realClient.auth.signInWithPassword(creds);
      // Mock login always success for demo if locally validated
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
    // Chainable query builder mock
    let queryData = mockStorage.get(table);
    let error: any = null;

    return {
      select: (columns: string = '*') => {
        if (realClient) return realClient.from(table).select(columns);
        // Return a promise-like object for the chain
        return {
          eq: (col: string, val: any) => {
            queryData = queryData.filter((row: any) => row[col] === val);
            return {
              single: async () => ({ data: queryData[0] || null, error: queryData.length ? null : { message: 'Not found' } }),
              order: (col: string, { ascending = true }: any = {}) => {
                 queryData.sort((a: any, b: any) => ascending ? (a[col] > b[col] ? 1 : -1) : (a[col] < b[col] ? 1 : -1));
                 return {
                    limit: (n: number) => ({
                        then: (resolve: any) => resolve({ data: queryData.slice(0, n), error })
                    }),
                    then: (resolve: any) => resolve({ data: queryData, error })
                 };
              },
              then: (resolve: any) => resolve({ data: queryData, error })
            };
          },
          order: (col: string, { ascending = true }: any = {}) => {
             queryData.sort((a: any, b: any) => ascending ? (a[col] > b[col] ? 1 : -1) : (a[col] < b[col] ? 1 : -1));
             return {
                limit: (n: number) => ({
                    then: (resolve: any) => resolve({ data: queryData.slice(0, n), error })
                }),
                then: (resolve: any) => resolve({ data: queryData, error })
             };
          },
          then: (resolve: any) => resolve({ data: queryData, error })
        };
      },
      insert: async (data: any) => {
        if (realClient) return realClient.from(table).insert(data);
        const newItem = Array.isArray(data) ? data.map(d => mockStorage.add(table, d)) : mockStorage.add(table, data);
        return { data: newItem, error: null };
      },
      update: (data: any) => {
        if (realClient) return realClient.from(table).update(data);
        return {
            eq: async (col: string, val: any) => {
                const items = mockStorage.get(table);
                const updated = items.map((item: any) => {
                    if (item[col] === val) return { ...item, ...data };
                    return item;
                });
                mockStorage.set(table, updated);
                return { data: updated.find((i: any) => i[col] === val), error: null };
            }
        };
      },
      upsert: async (data: any) => {
        if (realClient) return realClient.from(table).upsert(data);
        const res = mockStorage.add(table, data);
        return { data: res, error: null };
      },
    };
  }
};
