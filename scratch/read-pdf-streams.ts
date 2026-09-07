import fs from "fs";
import zlib from "zlib";
import path from "path";

const pdfPath = path.resolve(process.cwd(), "scratch/user_resume_modern.pdf");
const buf = fs.readFileSync(pdfPath);
const str = buf.toString("latin1");

const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
let match;
let count = 0;

while ((match = streamRegex.exec(str)) !== null) {
  count++;
  const rawStream = Buffer.from(match[1], "latin1");
  try {
    const decompressed = zlib.inflateSync(rawStream).toString("utf-8");
    console.log(`\n--- Stream ${count} Decompressed (length ${decompressed.length}) ---`);
    console.log(decompressed);
  } catch (err: any) {
    // not flate
  }
}
