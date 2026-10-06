import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

for (const name of ["vision_wasm_internal.js", "vision_wasm_module_internal.js", "vision_wasm_nosimd_internal.js"]) {
  test(`${name}: routes only CPU startup info away from the error console`, async () => {
    const source = await readFile(new URL(`../public/mediapipe/${name}`, import.meta.url), "utf8");
    const logger = source.match(/var err = function \(\.\.\.args\) \{[\s\S]*?\n\};/)?.[0];
    assert.ok(logger, "The native logger patch must be present");
    const errors = [], information = [];
    const context = vm.createContext({ console: { error: (...args) => errors.push(args), info: (...args) => information.push(args) } });
    vm.runInContext(logger, context);
    context.err("INFO: Created TensorFlow Lite XNNPACK delegate for CPU.");
    context.err("Model inference failed", "BAD_MODEL");
    context.err("INFO: Another diagnostic");
    assert.deepEqual(information, [["INFO: Created TensorFlow Lite XNNPACK delegate for CPU."]]);
    assert.deepEqual(errors, [["Model inference failed", "BAD_MODEL"], ["INFO: Another diagnostic"]]);
  });
}
