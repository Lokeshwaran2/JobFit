import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ResumeDocument } from "@/components/resume-document";
import { resolveTemplateId, TemplateId } from "../templates/template-registry";
import { fork } from "child_process";
import path from "path";
import fs from "fs";

/**
 * Renders the resume to a PDF buffer in an isolated Node process.
 *
 * This is essential in Next.js Server environments because Next.js 15 App Router
 * compiles Server Components and Route Handlers with React Server Component (RSC)
 * runtime, which lacks ReactCurrentDispatcher / reconciler symbols required by @react-pdf.
 */
async function renderViaWorker(
  data: any,
  templateId?: TemplateId | string | null
): Promise<Buffer> {
  const rootDir = process.cwd();
  const candidateBundlePaths = [
    path.resolve(rootDir, "src/lib/export/render-pdf-worker.bundle.cjs"),
    path.resolve(__dirname, "render-pdf-worker.bundle.cjs"),
    path.resolve(__dirname, "../render-pdf-worker.bundle.cjs"),
    path.resolve(__dirname, "../../src/lib/export/render-pdf-worker.bundle.cjs"),
    path.resolve(rootDir, ".next/server/src/lib/export/render-pdf-worker.bundle.cjs"),
  ];

  let workerScript = candidateBundlePaths.find((p) => fs.existsSync(p));
  let execArgs: string[] = [];

  if (!workerScript) {
    const tsWorkerPath = path.resolve(rootDir, "src/lib/export/render-pdf-worker.ts");
    const tsxCli = path.resolve(rootDir, "node_modules/tsx/dist/cli.mjs");
    if (fs.existsSync(tsxCli) && fs.existsSync(tsWorkerPath)) {
      workerScript = tsxCli;
      execArgs = [tsWorkerPath];
    }
  }

  if (!workerScript) {
    throw new Error(
      `PDF worker bundle not found. Checked candidate paths: ${candidateBundlePaths.join(", ")}`
    );
  }

  return new Promise<Buffer>((resolve, reject) => {
    const child = fork(workerScript, execArgs, {
      stdio: ["pipe", "pipe", "pipe", "ipc"],
      execPath: process.execPath,
    });

    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("PDF generation worker timed out after 30 seconds"));
    }, 30000);

    child.on("message", (msg: any) => {
      clearTimeout(timeout);
      if (msg?.success && msg?.buffer) {
        resolve(Buffer.from(msg.buffer, "base64"));
      } else {
        reject(new Error(msg?.error || "PDF generation worker returned failure"));
      }
    });

    child.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    child.on("exit", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(`PDF generation worker exited with code ${code}`));
      }
    });

    child.send({ data, templateId });
  });
}

/**
 * Generates a clean, machine-readable, multi-page vector PDF Buffer
 * using the validated candidate resume data and selected template.
 *
 * Rules:
 * 1. Preserves all factual content without modification.
 * 2. Uses page-break protection on job blocks and section headings.
 * 3. Text remains machine-readable vector text (never rasterized images).
 */
export async function generateResumePdfBuffer(
  data: any,
  templateId?: TemplateId | string | null
): Promise<Buffer> {
  const resolvedTemplate = resolveTemplateId(templateId);

  // In standalone Node/test runner (e.g. tsx src/lib/export/__tests__/export.test.ts),
  // renderToBuffer executes in-process directly for maximum speed.
  try {
    const element = React.createElement(ResumeDocument, {
      data,
      templateId: resolvedTemplate,
    });
    const buffer = await renderToBuffer(element as any);
    return Buffer.from(buffer);
  } catch (err: any) {
    // In Next.js Server Components / Route Handler environment, React RSC internals
    // cause in-process render to throw. Fall back to isolated self-contained worker.
    return renderViaWorker(data, resolvedTemplate);
  }
}
