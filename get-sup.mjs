import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rifoqdtxackzjallnobi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZm9xZHR4YWNremphbGxub2JpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY2MTAzNiwiZXhwIjoyMDg3MjM3MDM2fQ.m_MdHZqAB9VLDOWtGXO7irjuZhJaVERjZ8fDc6jlEvg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data: sups } = await supabase.from('users').select('*').eq('id', 'f2f69e14-9e91-4ff8-88f0-c776243168b4');
    console.log("Supervisor email:", sups[0]?.email);
}
run();
