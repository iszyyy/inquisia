import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rifoqdtxackzjallnobi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZm9xZHR4YWNremphbGxub2JpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY2MTAzNiwiZXhwIjoyMDg3MjM3MDM2fQ.m_MdHZqAB9VLDOWtGXO7irjuZhJaVERjZ8fDc6jlEvg';
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = 'http://localhost:3000/api';
let cookie = '';

async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (cookie) headers.set('cookie', cookie);
    if (options.body && typeof options.body !== 'string' && !(options.body instanceof FormData)) {
        options.body = JSON.stringify(options.body);
    }
    if (options.body && typeof options.body === 'string') {
        headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie;

    const text = await res.text();
    try {
        return { status: res.status, data: JSON.parse(text) };
    } catch (e) {
        return { status: res.status, text };
    }
}

async function run() {
    console.log("1. Fetch departments...");
    let res = await request('/departments');
    const departmentId = res.data.data?.[0]?.id || null;

    console.log("2. Registering new supervisor...");
    const email = `test_sup_${Date.now()}@babcock.edu.ng`;
    res = await request('/auth/register', {
        method: 'POST',
        body: {
            email,
            password: 'password123',
            role: 'supervisor',
            full_name: 'Test Supervisor',
            staff_id: `STAFF_${Date.now()}`,
            degrees: 'PhD Computer Science',
            department_id: departmentId
        }
    });
    console.log("Register response:", res.data);
    const newId = res.data.data?.id;
    if (!newId) return;

    console.log("3. Verifying using Supabase service role...");
    await supabase.from('users').update({ is_verified: true }).eq('id', newId);

    console.log("4. Assigning previous test project to new supervisor...");
    await supabase.from('projects').update({ supervisor_id: newId }).eq('id', 'c19111f1-f8f2-4d72-b24d-872ef6e6128e');

    console.log("5. Logging in with new supervisor...");
    cookie = '';
    res = await request('/auth/login', {
        method: 'POST',
        body: { email, password: 'password123' }
    });
    console.log("Login success:", res.data.success);

    console.log("6. Fetching Supervisor Dashboard pending queue...");
    res = await request('/supervisor/projects');

    const pendingProjects = res.data.data?.filter(p => p.status === 'pending') || [];
    console.log("Pending Queue Data Length:", pendingProjects.length);
    const projectToApprove = pendingProjects[0];
    if (!projectToApprove) return;

    console.log("7. Approving Project...", projectToApprove.id);
    res = await request(`/projects/${projectToApprove.id}/status`, {
        method: 'PATCH',
        body: { status: 'approved', feedback: 'Looks perfectly fine, standard auto-approve script.' }
    });
    console.log("Approve response:", res.data);

    console.log("8. Verifying project is public...");
    const verifyRes = await fetch(`http://localhost:3000/api/projects/${projectToApprove.id}/public`);
    const verifyData = await verifyRes.json();
    console.log(`Public fetch status: ${verifyData.data?.status === 'approved' ? 'YES, PUBLIC' : 'NOT PUBLIC'}`);
}

run().catch(console.error);
