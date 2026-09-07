import fs from "fs";
import path from "path";

const pdfPath = path.resolve(process.cwd(), "scratch/user_resume_modern.pdf");
const buf = fs.readFileSync(pdfPath);
console.log("File length:", buf.length);
console.log("Start:", buf.subarray(0, 50).toString());
console.log("End:", buf.subarray(buf.length - 50).toString());

// Also let's check pdf-parse on a standard pdf or what failed
const text = buf.toString("latin1");
console.log("Contains PDF version:", text.slice(0, 10));
console.log("Trailer exists:", text.includes("trailer") || text.includes("startxref"));
