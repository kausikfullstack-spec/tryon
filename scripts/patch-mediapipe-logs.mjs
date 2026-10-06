import { readFile, writeFile } from "node:fs/promises";

const original = "var err = console.error.bind(console);";
const replacement = `// Glasstryon: native INFO goes to stderr; preserve actual error diagnostics.
var err = function (...args) {
  if (args.length === 1 && args[0] === "INFO: Created TensorFlow Lite XNNPACK delegate for CPU.") {
    console.info(args[0]);
    return;
  }
  console.error(...args);
};`;

for (const name of ["vision_wasm_internal.js", "vision_wasm_module_internal.js", "vision_wasm_nosimd_internal.js"]) {
  const file = new URL(`../public/mediapipe/${name}`, import.meta.url);
  const source = await readFile(file, "utf8");
  if (source.includes(replacement)) continue;
  if (!source.includes(original)) throw new Error(`MediaPipe logger changed in ${name}; review the patch before updating.`);
  await writeFile(file, source.replace(original, replacement));
}
