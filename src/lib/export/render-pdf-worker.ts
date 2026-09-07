import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { ResumeDocument } from "@/components/resume-document";
import { resolveTemplateId } from "@/lib/templates/template-registry";

process.on("message", async (msg: any) => {
  try {
    const { data, templateId } = msg;
    const resolvedTemplate = resolveTemplateId(templateId);
    const element = React.createElement(ResumeDocument, {
      data,
      templateId: resolvedTemplate,
    });
    const buffer = await renderToBuffer(element as any);
    process.send?.({
      success: true,
      buffer: Buffer.from(buffer).toString("base64"),
    });
    process.exit(0);
  } catch (err: any) {
    process.send?.({
      success: false,
      error: err?.message || String(err),
    });
    process.exit(1);
  }
});
