/**
 * Supabase Configuration
 */

const SUPABASE_URL = 'https://nfgyqbbpvoksisjnjshw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZ3lxYmJwdm9rc2lzam5qc2h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzQ1MzYsImV4cCI6MjA4NjE1MDUzNn0.yitqlakLQOH1qw4bbhPNf42fugm2NVW95TZhG4Tm6fA';

// Check if credentials are configured
const isSupabaseConfigured = () => {
    return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
};

// Lazy initialization - create client only when needed
let _supabaseClient = null;

const getSupabaseClient = () => {
    if (_supabaseClient) return _supabaseClient;

    // Check if Supabase library is loaded
    if (typeof window !== 'undefined' && window.supabase && isSupabaseConfigured()) {
        _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return _supabaseClient;
};

// Export for use
window.SupabaseConfig = {
    url: SUPABASE_URL,
    key: SUPABASE_ANON_KEY,
    getClient: getSupabaseClient,
    isConfigured: isSupabaseConfigured
};
