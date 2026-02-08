/**
 * Supabase Configuration
 */

const SUPABASE_URL = 'https://nfgyqbbpvoksisjnjshw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZ3lxYmJwdm9rc2lzam5qc2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzQ1MzYsImV4cCI6MjA4NjE1MDUzNn0.yitqlakLQOH1qw4bbhPNf42fugm2NVW95TZhG4Tm6fA';

// Check if credentials are configured
const isSupabaseConfigured = () => {
    return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
};

// Initialize Supabase client (loaded from CDN in HTML)
let supabase = null;

if (typeof window !== 'undefined' && window.supabase && isSupabaseConfigured()) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Export for use
window.SupabaseConfig = {
    url: SUPABASE_URL,
    key: SUPABASE_ANON_KEY,
    client: supabase,
    isConfigured: isSupabaseConfigured
};
