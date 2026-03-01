import fs from 'fs';

const BASE_URL = 'http://localhost:3000/api';
let cookie = '';

async function request(path, options = {}) {
    const headers = new Headers(options.headers || {});
    if (cookie) headers.set('cookie', cookie);
    if (!(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers,
    });

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
        cookie = setCookie;
    }

    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        console.log(`Failed to parse JSON for ${path}:`, text);
        throw e;
    }
}

async function run() {
    console.log("1. Fetch departments...");
    let res = await request('/departments');
    const departmentId = res.data?.[0]?.id || null;
    console.log("Department ID:", departmentId);

    console.log("2. Registering student...");
    const email = `test_upload_${Date.now()}@student.babcock.edu.ng`;
    res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            email,
            password: 'password123',
            role: 'student',
            full_name: 'Test Uploader',
            display_name: 'Test Uploader',
            matric_no: '123456',
            level: '400',
            department_id: departmentId
        })
    });
    console.log("Register response:", res);

    console.log("3. Fetch supervisors...");
    res = await request('/supervisors');
    const supervisorId = res.data?.[0]?.id || null;
    console.log("Supervisor ID:", supervisorId);

    console.log("4. Fetching PDF...");
    // Use the actual lorem ipsum PDF inside inquisia.v2 if needed, 
    // but a dummy PDF won't parse correctly with pdf-parse and will fail!
    // It needs to be a real PDF. We will use `Lorem_ipsum.pdf` from the parent directory!
    const pdfPath = '../inquisia.v2/Lorem_ipsum.pdf';
    const fileBuffer = fs.readFileSync(pdfPath);
    const fileBlob = new Blob([fileBuffer], { type: 'application/pdf' });
    const form = new FormData();
    form.append('file', fileBlob, 'Lorem_ipsum.pdf');

    const metadata = {
        title: "The Effects of PDF Parsing on Mental Health in Final Year Projects",
        abstract: "This abstract is designed to be longer than fifty characters so that it smoothly passes the validation threshold within the Zod schema configuration defined in the application source code.",
        supervisor_id: supervisorId,
        student_tags: ["pdf", "parsing", "mental", "health"],
        co_authors: []
    };
    form.append('metadata', JSON.stringify(metadata));

    console.log("5. Submitting Project to /projects (handles upload + parsing)...");
    res = await fetch(`${BASE_URL}/projects`, {
        method: 'POST',
        body: form,
        headers: {
            'cookie': cookie
        }
    });

    const upData = await res.json();
    console.log("Submit Response Summary:");
    console.dir(upData, { depth: null });

    if (!upData.success) {
        console.error("Upload FAILED:", upData.error);
    } else {
        console.log("Upload SUCCESS! Project ID:", upData.data.id);
    }
}

run().catch(console.error);
