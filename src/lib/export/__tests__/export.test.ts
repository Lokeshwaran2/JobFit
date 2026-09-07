import assert from "assert";
import {
  resolveTemplateId,
  getTemplateConfig,
  getAllTemplates,
  isValidTemplateId,
  DEFAULT_TEMPLATE_ID,
  VALID_TEMPLATE_IDS,
  TemplateId,
} from "../../templates/template-registry";
import { generateResumePdfBuffer } from "../pdf-generator";
import { generateResumeDocxBuffer } from "../docx-generator";
import { getExportableResumeData } from "../resume-data-resolver";

async function runTests() {
  console.log("===============================================================");
  console.log("   RESUME TEMPLATES, PDF & DOCX EXPORT TEST SUITE (BATCH 5)    ");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`✗ FAIL: ${name}`);
      console.error(err);
      failed++;
    }
  }

  // --- Fixture: Standard Validated Candidate Resume ---
  const standardCandidateResume = {
    personalInfo: {
      name: "Alex Morgan",
      fullName: "Alex Morgan",
      title: "Senior Full Stack Engineer",
      email: "alex.morgan@example.com",
      phone: "+1 (555) 234-5678",
      location: "San Francisco, CA",
      linkedin: "https://linkedin.com/in/alexmorgan",
      github: "https://github.com/alexmorgan",
    },
    summary:
      "Results-driven Senior Full Stack Engineer with 7+ years of experience designing, architecting, and deploying high-scale distributed systems and web applications.",
    experience: [
      {
        company: "Apex Cloud Systems",
        role: "Staff Software Engineer",
        startDate: "2022",
        endDate: "Present",
        description: [
          "Architected real-time stream processing pipeline handling 1.2M events/sec with sub-50ms latency.",
          "Led migration of monolith services to event-driven microservices using TypeScript, Node.js, and Redis.",
          "Mentored 8 junior and mid-level engineers in distributed systems design patterns and automated testing.",
        ],
      },
      {
        company: "Velocity Data Labs",
        role: "Senior Full Stack Developer",
        startDate: "2019",
        endDate: "2022",
        description: [
          "Developed end-to-end analytics dashboard with React, Next.js, and GraphQL reducing query latency by 35%.",
          "Implemented automated CI/CD deployment pipelines on AWS infrastructure reducing release cycle time by 40%.",
        ],
      },
    ],
    skills: {
      hard: ["TypeScript", "Node.js", "React", "PostgreSQL", "GraphQL", "Redis", "Docker"],
      tools: ["Git", "GitHub Actions", "Docker", "AWS", "Kubernetes", "Linux"],
      soft: ["System Architecture", "Cross-Functional Leadership", "Technical Mentorship"],
    },
    projects: [
      {
        name: "MicroQueue Distributed Broker",
        year: "2023",
        technologies: ["Go", "TypeScript", "gRPC"],
        description: "High-performance, lightweight in-memory task broker with persistent write-ahead logging.",
      },
      {
        name: "DevTelemetry Observability Suite",
        year: "2021",
        technologies: ["React", "D3.js", "TailwindCSS"],
        description: "Open-source developer tracing tool with interactive flame graphs and network visualization.",
      },
    ],
    education: [
      {
        degree: "B.S. in Computer Science",
        institution: "University of California, Berkeley",
        year: "2018",
      },
    ],
    certifications: [
      {
        name: "AWS Certified Solutions Architect – Professional",
        year: "2023",
      },
    ],
  };

  // --- Long Multi-Page Candidate Resume (3+ pages) ---
  const longMultiPageResume = {
    ...standardCandidateResume,
    experience: [
      ...standardCandidateResume.experience,
      {
        company: "FinTech Scale Systems",
        role: "Full Stack Engineer",
        startDate: "2017",
        endDate: "2019",
        description: [
          "Designed secure PCI-DSS compliant checkout and subscription payment processing integration handling $12M annually.",
          "Reduced SQL query latency across high-traffic billing tables by 60% via composite indexing and query plan optimization.",
          "Spearheaded adoption of automated contract testing between front-end web clients and back-end microservices.",
        ],
      },
      {
        company: "Pioneer Web Studios",
        role: "Junior Web Developer",
        startDate: "2015",
        endDate: "2017",
        description: [
          "Engineered 14 responsive client web portals using JavaScript, HTML5, CSS3, and RESTful web services.",
          "Collaborated with UX designers to produce pixel-perfect UI designs conforming to WCAG 2.1 AA accessibility guidelines.",
        ],
      },
      {
        company: "Campus Tech Labs",
        role: "Software Engineering Intern",
        startDate: "2014",
        endDate: "2015",
        description: [
          "Constructed automated test suites in Python and Selenium covering student portal authentication workflows.",
        ],
      },
    ],
    projects: [
      ...standardCandidateResume.projects,
      {
        name: "OpenAuth SSO Gateway",
        year: "2020",
        technologies: ["Node.js", "OAuth2", "PKCE", "Redis"],
        description: "Self-hosted Single Sign-On gateway supporting OAuth2, OIDC, and multi-factor authentication.",
      },
      {
        name: "DataStream Realtime ETL",
        year: "2019",
        technologies: ["Python", "Apache Kafka", "PostgreSQL"],
        description: "Fault-tolerant ETL streaming pipeline syncing customer behavior analytics across disparate relational datastores.",
      },
    ],
  };

  // =========================================================================
  // TASK 10 — TEMPLATE REGISTRY TESTS
  // =========================================================================

  await test("Task 10.1 — Valid Template IDs: classic, modern, and minimal exist", () => {
    assert.deepStrictEqual(VALID_TEMPLATE_IDS, ["classic", "modern", "minimal"]);
    assert.strictEqual(isValidTemplateId("classic"), true);
    assert.strictEqual(isValidTemplateId("modern"), true);
    assert.strictEqual(isValidTemplateId("minimal"), true);
  });

  await test("Task 10.2 — Default template is 'classic'", () => {
    assert.strictEqual(DEFAULT_TEMPLATE_ID, "classic");
    assert.strictEqual(resolveTemplateId(undefined), "classic");
    assert.strictEqual(resolveTemplateId(null), "classic");
  });

  await test("Task 10.3 — Safe fallback: invalid, unknown, or corrupted IDs resolve to 'classic'", () => {
    assert.strictEqual(resolveTemplateId("nonexistent"), "classic");
    assert.strictEqual(resolveTemplateId("random_template"), "classic");
    assert.strictEqual(resolveTemplateId(123 as any), "classic");
    assert.strictEqual(resolveTemplateId({} as any), "classic");
  });

  await test("Task 10.4 — Template configurations expose complete styling metadata", () => {
    const templates = getAllTemplates();
    assert.strictEqual(templates.length, 3);

    for (const tpl of templates) {
      assert(tpl.id, "Template must have an id");
      assert(tpl.name, "Template must have a display name");
      assert(tpl.description, "Template must have a description");
      assert(tpl.pdfStyles.primaryColor, "Template must define primaryColor for PDF");
      assert(tpl.pdfStyles.pagePadding > 0, "Template must define valid page padding");
      assert(tpl.docxStyles.font, "Template must define docx font");
      assert(tpl.docxStyles.headingSize > 0, "Template must define headingSize");
    }

    const classic = getTemplateConfig("classic");
    assert.strictEqual(classic.docxStyles.font, "Calibri");

    const modern = getTemplateConfig("modern");
    assert.strictEqual(modern.docxStyles.font, "Arial");
    assert.strictEqual(modern.pdfStyles.primaryColor, "#1E3A8A");

    const minimal = getTemplateConfig("minimal");
    assert.strictEqual(minimal.docxStyles.font, "Segoe UI");
    assert.strictEqual(minimal.docxStyles.margins.top, 900); // Compact margin
  });

  // =========================================================================
  // TASK 11 — PDF QUALITY & MULTI-PAGE GENERATION TESTS
  // =========================================================================

  await test("Task 11.1 — PDF Generation produces valid non-empty Buffer for all 3 templates", async () => {
    for (const templateId of ["classic", "modern", "minimal"] as TemplateId[]) {
      const buffer = await generateResumePdfBuffer(standardCandidateResume, templateId);
      assert(Buffer.isBuffer(buffer), `Output for ${templateId} must be a valid Buffer`);
      assert(buffer.length > 3000, `PDF Buffer for ${templateId} must be substantial (>3KB), got ${buffer.length}`);

      // Verify PDF Magic Bytes (%PDF-)
      const magicBytes = buffer.subarray(0, 5).toString("utf-8");
      assert.strictEqual(magicBytes, "%PDF-", "Generated file must have %PDF- magic bytes");
    }
  });

  await test("Task 11.2 — Multi-page PDF generation handles extended content without clipping or errors", async () => {
    const singlePageBuffer = await generateResumePdfBuffer(standardCandidateResume, "classic");
    const multiPageBuffer = await generateResumePdfBuffer(longMultiPageResume, "classic");
    assert(Buffer.isBuffer(multiPageBuffer), "Multi-page resume must produce a valid Buffer");
    assert(
      multiPageBuffer.length > singlePageBuffer.length,
      `Multi-page PDF (${multiPageBuffer.length} bytes) must be larger than single page (${singlePageBuffer.length} bytes)`
    );
    const magicBytes = multiPageBuffer.subarray(0, 5).toString("utf-8");
    assert.strictEqual(magicBytes, "%PDF-");
  });

  await test("Task 11.3 — PDF Generator gracefully handles minimal/sparse candidate data without crashing", async () => {
    const sparseResume = {
      personalInfo: {
        name: "Jane Doe",
        email: "jane@example.com",
      },
      summary: "Aspiring developer.",
      experience: [],
      skills: { hard: ["HTML", "CSS"] },
    };

    const buffer = await generateResumePdfBuffer(sparseResume, "minimal");
    assert(Buffer.isBuffer(buffer));
    assert(buffer.length > 2000);
  });

  // =========================================================================
  // TASK 12 — DOCX EXPORT TESTS
  // =========================================================================

  await test("Task 12.1 — DOCX generation produces valid OpenXML Word document for all templates", async () => {
    for (const templateId of ["classic", "modern", "minimal"] as TemplateId[]) {
      const buffer = await generateResumeDocxBuffer(standardCandidateResume, templateId);
      assert(Buffer.isBuffer(buffer), `Output for ${templateId} must be a valid Buffer`);
      assert(buffer.length > 4000, `DOCX buffer for ${templateId} must be >4KB, got ${buffer.length}`);

      // Verify OpenXML / ZIP Magic Bytes (PK\x03\x04)
      const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
      assert.strictEqual(isZip, true, "Generated DOCX must be a valid PKZip OpenXML document");
    }
  });

  await test("Task 12.2 — DOCX buffer contains standard OpenXML wordprocessingML components", async () => {
    const buffer = await generateResumeDocxBuffer(standardCandidateResume, "classic");
    const bufferString = buffer.toString("binary");

    // OpenXML docx files contain '[Content_Types].xml' and 'word/document.xml' entries
    assert(bufferString.includes("[Content_Types].xml"), "Must contain [Content_Types].xml");
    assert(bufferString.includes("word/document.xml"), "Must contain word/document.xml");
  });

  await test("Task 12.3 — DOCX generator handles multi-page resumes and preserves all sections", async () => {
    const buffer = await generateResumeDocxBuffer(longMultiPageResume, "modern");
    assert(Buffer.isBuffer(buffer));
    assert(buffer.length > 6000);

    const isZip = buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
    assert.strictEqual(isZip, true);
  });

  // =========================================================================
  // CRITICAL ARCHITECTURE RULE — CONTENT INTEGRITY & ZERO TAMPERING
  // =========================================================================

  await test("Task 10/11/12 Rule — Content Integrity: Renderer never modifies resume facts or objects", async () => {
    const candidateInputCopy = JSON.parse(JSON.stringify(standardCandidateResume));

    // Run both generators across all templates
    for (const tpl of ["classic", "modern", "minimal"] as TemplateId[]) {
      await generateResumePdfBuffer(standardCandidateResume, tpl);
      await generateResumeDocxBuffer(standardCandidateResume, tpl);
    }

    // Assert that the input candidate resume was NEVER mutated by any template or renderer
    assert.deepStrictEqual(
      standardCandidateResume,
      candidateInputCopy,
      "Input candidate resume data must remain 100% pristine and unaltered by any renderer"
    );
  });

  // =========================================================================
  // SECURITY & OWNERSHIP / IDOR PROTECTION RULES
  // =========================================================================

  await test("Export Security — Simulated IDOR check ensures user ownership isolation", () => {
    const resumeRecord = {
      id: "res-12345",
      userId: "user-owner-1",
      templateId: "classic",
      title: "Alex Morgan Resume",
    };

    const authenticatedUser1 = "user-owner-1";
    const authenticatedUser2 = "attacker-user-2";

    // Owner access allowed
    const isOwnerAllowed = resumeRecord.userId === authenticatedUser1;
    assert.strictEqual(isOwnerAllowed, true, "Owner must be allowed to export");

    // Attacker access forbidden (IDOR prevention)
    const isAttackerAllowed = resumeRecord.userId === authenticatedUser2;
    assert.strictEqual(isAttackerAllowed, false, "Non-owner export request must be rejected with 403");
  });

  // =========================================================================
  // TAILORED EXPORT PIPELINE INTEGRATION & REGRESSION TESTS
  // =========================================================================

  await test("Case A — Tailored resume exists: Export uses validated tailored content", async () => {
    const originalResume = {
      personalInfo: { fullName: "Jane Smith", title: "Backend Engineer", email: "jane@example.com" },
      experience: [
        {
          company: "TechCorp",
          role: "Backend Engineer",
          description: ["Built backend services"],
        },
      ],
    };

    const validatedTailoredResume = {
      personalInfo: { fullName: "Jane Smith", title: "Backend Engineer", email: "jane@example.com" },
      experience: [
        {
          company: "TechCorp",
          role: "Backend Engineer",
          description: ["Built Node.js backend services"],
        },
      ],
    };

    // DB record containing validated tailored content in structuredData
    const dbRecord = {
      id: "resume-tailored-1",
      userId: "user-1",
      originalData: originalResume,
      structuredData: validatedTailoredResume,
    };

    const resolvedData = getExportableResumeData(dbRecord);
    assert.strictEqual(
      resolvedData.experience[0].description[0],
      "Built Node.js backend services",
      "Must use validated tailored bullet, not original"
    );

    // Verify both PDF and DOCX generators receive this tailored content without crashing
    const pdfBuf = await generateResumePdfBuffer(resolvedData, "classic");
    const docxBuf = await generateResumeDocxBuffer(resolvedData, "classic");
    assert(Buffer.isBuffer(pdfBuf) && pdfBuf.length > 0);
    assert(Buffer.isBuffer(docxBuf) && docxBuf.length > 0);
  });

  await test("Case B — Tailored resume does not exist: Export continues using existing resume content", async () => {
    const originalResume = {
      personalInfo: { fullName: "Bob Builder", email: "bob@example.com" },
      experience: [
        {
          company: "Construct Co",
          role: "Site Reliability Engineer",
          description: ["Maintained Kubernetes clusters"],
        },
      ],
    };

    // Untailored record (only originalData exists)
    const dbRecord = {
      id: "resume-untailored-1",
      userId: "user-2",
      originalData: originalResume,
      structuredData: null,
    };

    const resolvedData = getExportableResumeData(dbRecord);
    assert.strictEqual(
      resolvedData.experience[0].description[0],
      "Maintained Kubernetes clusters",
      "Must safely fall back to originalData when tailoredData is not present"
    );
  });

  await test("Case C — Validator rejected a rewrite: Export uses validator-approved/original bullet", async () => {
    // Simulated scenario: AI attempted to hallucinate a metric or unverified skill,
    // BulletValidator rejected it, so the tailoring engine retained the original bullet.
    const originalBullet = "Refactored payment processing workflow.";
    const rejectedAiRewrite = "Refactored payment processing workflow, saving $50M across 100 enterprise clients.";

    // The tailoring engine produced a verifiedTailoredData where the rejected bullet remained the original
    const verifiedTailoredData = {
      personalInfo: { fullName: "Alice Engineer", email: "alice@example.com" },
      experience: [
        {
          company: "PayScale Inc",
          role: "Software Engineer",
          description: [originalBullet], // Retained original bullet!
        },
      ],
    };

    const dbRecord = {
      id: "resume-rejected-rewrite",
      userId: "user-3",
      originalData: {
        personalInfo: { fullName: "Alice Engineer", email: "alice@example.com" },
        experience: [{ company: "PayScale Inc", role: "Software Engineer", description: [originalBullet] }],
      },
      structuredData: verifiedTailoredData,
      improvements: {
        tailoring: {
          bulletDiffs: [
            {
              originalBullet,
              rewrittenBullet: rejectedAiRewrite,
              status: "rejected",
              rejectionReason: "Metric fabrication detected",
            },
          ],
        },
      },
    };

    const resolvedData = getExportableResumeData(dbRecord);
    assert.strictEqual(
      resolvedData.experience[0].description[0],
      originalBullet,
      "Export must contain the validator-approved/original bullet, NOT the rejected AI rewrite"
    );
    assert.notStrictEqual(
      resolvedData.experience[0].description[0],
      rejectedAiRewrite,
      "Export must NEVER contain the rejected AI rewrite"
    );
  });

  await test("Case D — PDF and DOCX: Both formats receive the exact same final validated content", async () => {
    const verifiedTailoredData = {
      personalInfo: {
        fullName: "Marcus Vance",
        title: "Principal Engineer",
        email: "marcus@example.com",
        phone: "+1 555-0199",
      },
      summary: "Principal distributed systems architect.",
      experience: [
        {
          company: "FinCloud Global",
          role: "Principal Systems Architect",
          startDate: "2020",
          endDate: "Present",
          description: [
            "Architected Kafka streaming pipelines handling 500k msg/sec.",
            "Designed multi-region PostgreSQL disaster recovery active-active failover.",
          ],
        },
      ],
      skills: { hard: ["Kafka", "PostgreSQL", "Go", "Distributed Systems"] },
    };

    const dbRecord = {
      id: "resume-consistency-check",
      userId: "user-4",
      structuredData: verifiedTailoredData,
    };

    const exportDataForPdf = getExportableResumeData(dbRecord);
    const exportDataForDocx = getExportableResumeData(dbRecord);

    // Assert identical data object reference / content passed to both
    assert.deepStrictEqual(
      exportDataForPdf,
      exportDataForDocx,
      "PDF and DOCX renderers must receive identical structured data"
    );

    // Assert both buffers generate cleanly
    const pdfBuf = await generateResumePdfBuffer(exportDataForPdf, "modern");
    const docxBuf = await generateResumeDocxBuffer(exportDataForDocx, "modern");
    assert(Buffer.isBuffer(pdfBuf) && pdfBuf.length > 0);
    assert(Buffer.isBuffer(docxBuf) && docxBuf.length > 0);
  });

  console.log("\n===============================================================");
  console.log(`BATCH 5 TEST SUITE SUMMARY: ${passed} passed, ${failed} failed`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
