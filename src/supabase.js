// ==========================================
// REMAL HOTEL & VILLAS - SUPABASE BRIDGE
// ==========================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://tfxzburpulyvjnvtqlgj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmeHpidXJwdWx5dmpudnRxbGdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0NzU0ODgsImV4cCI6MjEwMTA1MTQ4OH0.-kcVKnpSHkFitLLyk-ntSHAWPpIa_SpThOIa7FGpbV8';

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
