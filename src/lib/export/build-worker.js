const path = require("path");
const fs = require("fs");
const esbuild = require("esbuild");

function buildPdfWorkerBundle() {
  const entryPoint = path.resolve(__dirname, "render-pdf-worker.ts");
  const outfile = path.resolve(__dirname, "render-pdf-worker.bundle.cjs");

  if (fs.existsSync(outfile)) {
    try {
      const entryStat = fs.statSync(entryPoint);
      const outStat = fs.statSync(outfile);
      if (outStat.mtimeMs >= entryStat.mtimeMs && outStat.size > 0) {
        return outfile;
      }
    } catch {
      // ignore and rebuild
    }
  }

  esbuild.buildSync({
    entryPoints: [entryPoint],
    bundle: true,
    platform: "node",
    target: "node18",
    outfile,
    external: ["@react-pdf/renderer"],
  });

  return outfile;
}

if (require.main === module) {
  const out = buildPdfWorkerBundle();
  console.log("Built PDF Worker bundle at:", out);
}

module.exports = { buildPdfWorkerBundle };
