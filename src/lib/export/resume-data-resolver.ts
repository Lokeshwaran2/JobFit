/**
 * Resolves the final exportable candidate resume data for PDF and DOCX generation.
 *
 * Deterministic Pipeline Order:
 * 1. Validated Tailored Resume:
 *    - If `resume.structuredData` contains validated tailored experience/data, use it.
 *    - If `resume.improvements?.tailoredData` exists, prefer that explicit validated output.
 * 2. Original Parsed Resume:
 *    - Falls back to `resume.originalData` if tailoring has not occurred or structuredData is empty.
 *
 * Invariants:
 * - Deterministic: Same input record always produces the exact same structured data.
 * - Never calls AI or mutates candidate facts.
 * - If a bullet rewrite was rejected by BulletValidator, it preserves the original bullet.
 */
export function getExportableResumeData(resume: {
  structuredData?: any;
  originalData?: any;
  improvements?: any;
}): any {
  if (!resume) return {};

  // Check if improvements has an explicit validated tailoredData object
  const improvementsTailored = resume.improvements?.tailoredData;
  if (
    improvementsTailored &&
    typeof improvementsTailored === "object" &&
    Object.keys(improvementsTailored).length > 0
  ) {
    return improvementsTailored;
  }

  // Check structuredData (which stores tailoredData from TailoringService in /api/resume/analyze)
  const structured = resume.structuredData;
  if (
    structured &&
    typeof structured === "object" &&
    Object.keys(structured).length > 0
  ) {
    return structured;
  }

  // Fallback to original parsed candidate resume
  const original = resume.originalData;
  if (
    original &&
    typeof original === "object" &&
    Object.keys(original).length > 0
  ) {
    return original;
  }

  return {};
}
