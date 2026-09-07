import { generateResumePdfBuffer } from "../src/lib/export/pdf-generator";
import { generateResumeDocxBuffer } from "../src/lib/export/docx-generator";
import assert from "assert";

async function main() {
  const edgeResume = {
    personalInfo: {
      name: "Alex O'Connor & Partner",
      fullName: "Alex O'Connor & Partner",
      title: "Lead C# / .NET & C++ Architect",
      email: "alex+dev@domain-corp.co.uk",
      phone: "+1 (555) 019-2834 / (555) 019-2835",
      location: "New York, NY (Remote / Hybrid)",
    },
    summary: "Senior Architect specializing in C#, .NET 8, C++20, Node.js & PostgreSQL. 100% committed to high-reliability systems achieving 99.999% SLA.",
    experience: [
      {
        role: "Principal C# / .NET Developer — Core Infrastructure",
        company: "AT&T / FinTech Solutions Inc.",
        startDate: "2020",
        endDate: "Present",
        description: [
          "Delivered 45% latency reduction across .NET Core microservices handling 2.5M+ requests/day.",
          "Integrated PostgreSQL with custom C++ extensions; eliminated 99.9% of deadlocks under high concurrency.",
          "Spearheaded multi-tenant cloud security architecture (SOC-2 / PCI-DSS) protecting $100M+ in assets.",
          "Very long bullet point: Architected, developed, deployed, and continuously monitored end-to-end distributed transaction pipelines utilizing Apache Kafka, Redis pub/sub, PostgreSQL partitioned tables, and gRPC streaming across multiple availability zones with zero downtime over 24 consecutive months."
        ]
      }
    ],
    skills: {
      hard: ["C#", ".NET Core", "C++", "Node.js", "PostgreSQL", "CI/CD & DevOps"],
      tools: ["Git & GitHub", "Docker / Kubernetes", "Visual Studio 2022"],
      soft: ["Leadership & Mentoring", "Cross-Team Communication (Async / Sync)"]
    },
    education: [
      {
        degree: "B.S. in Computer Science & Engineering (Honors)",
        institution: "State University — College of Engineering",
        year: "2016-2020"
      }
    ]
  };

  console.log("Testing special/edge content with all 3 templates...");
  for (const tpl of ["classic", "modern", "minimal"] as const) {
    const pdfBuf = await generateResumePdfBuffer(edgeResume, tpl);
    const docxBuf = await generateResumeDocxBuffer(edgeResume, tpl);
    assert(pdfBuf.length > 3000, `PDF must be >3KB, got ${pdfBuf.length}`);
    assert(docxBuf.length > 3000, `DOCX must be >3KB, got ${docxBuf.length}`);
    assert.strictEqual(pdfBuf.subarray(0, 5).toString(), "%PDF-");
    console.log(`✓ Template ${tpl}: PDF (${pdfBuf.length} bytes), DOCX (${docxBuf.length} bytes)`);
  }
  console.log("ALL EDGE CONTENT TESTS PASSED!");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
