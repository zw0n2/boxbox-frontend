import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fmkpzamnlntacumnrxao.supabase.co';
const supabaseKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZta3B6YW1ubG50YWN1bW5yeGFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMDUwNDAsImV4cCI6MjA4MjU4MTA0MH0.Tr7gzVJyyxooibn33KNxgaciD5GjDwH8C-rjXeIa0nQ';

export const supabase = createClient(supabaseUrl, supabaseKey);
