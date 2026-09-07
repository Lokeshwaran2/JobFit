import fs from "fs";
import path from "path";

async function main() {
  const baseUrl = "http://localhost:3000";

  // 1. Get CSRF token
  const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
  const csrfCookie = csrfRes.headers.getSetCookie().map(c => c.split(';')[0]).join('; ');
  const { csrfToken } = await csrfRes.json();

  // 2. Login as smoke test user
  const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookie,
    },
    body: new URLSearchParams({
      csrfToken,
      email: "smoke-test-user@jobfit.test",
      password: "password123",
    }),
    redirect: "manual",
  });

  const rawCookies = loginRes.headers.getSetCookie();
  const cookieHeader = rawCookies.map(c => c.split(';')[0]).join('; ');

  const resumeId = "test-smoke-resume-id-12345";
  const templates = ["classic", "modern", "minimal"];

  console.log("==================================================");
  console.log("TESTING REAL PDF & DOCX EXPORT VIA NEXT.JS API");
  console.log("==================================================");

  for (const tpl of templates) {
    console.log(`\n--- Testing PDF export with template: ${tpl} ---`);
    const exportPdfRes = await fetch(`${baseUrl}/api/resume/${resumeId}/export?format=pdf&template=${tpl}`, {
      headers: { Cookie: cookieHeader }
    });

    console.log(`HTTP Status: ${exportPdfRes.status} ${exportPdfRes.statusText}`);
    console.log(`Content-Type: ${exportPdfRes.headers.get("content-type")}`);
    console.log(`Content-Disposition: ${exportPdfRes.headers.get("content-disposition")}`);

    if (exportPdfRes.status === 200) {
      const arrayBuf = await exportPdfRes.arrayBuffer();
      const buf = Buffer.from(arrayBuf);
      console.log(`✓ SUCCESS! PDF Buffer length: ${buf.length} bytes`);
      console.log(`Magic Bytes: ${buf.subarray(0, 5).toString("utf-8")}`);

      const outPath = path.resolve(process.cwd(), `scratch/exported_${tpl}.pdf`);
      fs.writeFileSync(outPath, buf);
      console.log(`Saved PDF to: ${outPath}`);
    } else {
      console.error(`✗ FAILED:`, await exportPdfRes.text());
    }

    console.log(`\n--- Testing DOCX export with template: ${tpl} ---`);
    const exportDocxRes = await fetch(`${baseUrl}/api/resume/${resumeId}/export?format=docx&template=${tpl}`, {
      headers: { Cookie: cookieHeader }
    });

    console.log(`HTTP Status: ${exportDocxRes.status} ${exportDocxRes.statusText}`);
    if (exportDocxRes.status === 200) {
      const arrayBuf = await exportDocxRes.arrayBuffer();
      const buf = Buffer.from(arrayBuf);
      console.log(`✓ SUCCESS! DOCX Buffer length: ${buf.length} bytes`);
    } else {
      console.error(`✗ FAILED:`, await exportDocxRes.text());
    }
  }

  // Also test IDOR protection: request without cookie or with attacker
  console.log("\n--- Testing Security / 401 Unauthorized check ---");
  const unauthRes = await fetch(`${baseUrl}/api/resume/${resumeId}/export?format=pdf`);
  console.log(`Unauthorized status: ${unauthRes.status} (expected 401)`);
}

main().catch(console.error);
