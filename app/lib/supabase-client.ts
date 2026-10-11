'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type SupabaseConfigResult =
  | { url: string; anonKey: string; error: null }
  | { url: null; anonKey: null; error: string };

type SupabaseClientResult =
  | { client: SupabaseClient; error: null }
  | { client: null; error: string };

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseConfig(): SupabaseConfigResult {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const missingVariables = [
    !supabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL',
    !supabaseAnonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ].filter((variable): variable is string => Boolean(variable));

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      url: null,
      anonKey: null,
      error: `Missing ${missingVariables.join(' and ')}. Add them to .env.local and restart the app.`,
    };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(supabaseUrl);
  } catch {
    return {
      url: null,
      anonKey: null,
      error: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL.',
    };
  }

  const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(parsedUrl.hostname);
  if (parsedUrl.protocol !== 'https:' && !(isLocalhost && parsedUrl.protocol === 'http:')) {
    return {
      url: null,
      anonKey: null,
      error: 'NEXT_PUBLIC_SUPABASE_URL must use HTTPS (HTTP is only allowed for localhost).',
    };
  }

  return { url: supabaseUrl, anonKey: supabaseAnonKey, error: null };
}

export function getSupabaseClient(): SupabaseClientResult {
  const config = getSupabaseConfig();
  if (config.error !== null) return { client: null, error: config.error };

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(config.url, config.anonKey);
    } catch (error) {
      return {
        client: null,
        error: error instanceof Error ? error.message : 'Could not initialize Supabase.',
      };
    }
  }

  return { client: supabaseClient, error: null };
}
