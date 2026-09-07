const path = require("path");
const fs = require("fs");
const esbuild = require("esbuild");

function buildPdfWorkerBundle() {
  const entryPoint = path.resolve(__dirname, "render-pdf-worker.ts");
  const outfile = path.resolve(__dirname, "render-pdf-worker.bundle.cjs");

  esbuild.buildSync({
    entryPoints: [entryPoint],
    bundle: true,
    platform: "node",
    target: "node18",
    outfile,
    external: [],
  });

  return outfile;
}

if (require.main === module) {
  const out = buildPdfWorkerBundle();
  console.log("Built PDF Worker bundle at:", out);
}

module.exports = { buildPdfWorkerBundle };
