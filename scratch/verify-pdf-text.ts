import fs from "fs";
import path from "path";
import { parsePdfToText } from "../src/lib/pdf-parser";

async function main() {
  const pdfPath = path.resolve(process.cwd(), "scratch/user_resume_modern.pdf");
  const dataBuffer = fs.readFileSync(pdfPath);
  const text = await parsePdfToText(dataBuffer);

  console.log("=========================================");
  console.log("PDF TEXT EXTRACTION VERIFICATION");
  console.log("=========================================");
  console.log("Text preview:\n");
  console.log(text.trim());
  console.log("=========================================");
}

main().catch(console.error);
