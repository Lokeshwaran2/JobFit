
// Polyfill for DOMMatrix in Node.js environment (required by pdf-parse/pdf.js)
if (typeof global.DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix {
        m11 = 1; m12 = 0; m13 = 0; m14 = 0;
        m21 = 0; m22 = 1; m23 = 0; m24 = 0;
        m31 = 0; m32 = 0; m33 = 1; m34 = 0;
        m41 = 0; m42 = 0; m43 = 0; m44 = 1;
        constructor() { }
    };
}

import pdf from "pdf-parse";
import mammoth from "mammoth";

export async function parsePdfToText(buffer: Buffer): Promise<string> {
    const data = await pdf(buffer);
    return data.text;
}

export async function parseDocxToText(buffer: Buffer): Promise<string> {
    const result = await mammoth.extractRawText({ buffer: buffer });
    return result.value;
}

export async function parseFileToText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type;
    const name = file.name.toLowerCase();

    if (mimeType === "application/pdf" || name.endsWith(".pdf")) {
        return parsePdfToText(buffer);
    } else if (
        mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        mimeType === "application/msword" ||
        name.endsWith(".docx") ||
        name.endsWith(".doc")
    ) {
        return parseDocxToText(buffer);
    } else {
        throw new Error("Unsupported file type. Please upload a PDF or DOCX/DOC file.");
    }
}
