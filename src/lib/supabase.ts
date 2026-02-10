import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente público para el navegador y operaciones normales
export const supabase = createClient(supabaseUrl, supabaseKey);

// Cliente administrativo (Service Role) - Solo disponible en entorno de servidor
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin = serviceKey 
  ? createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : null;