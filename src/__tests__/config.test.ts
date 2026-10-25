import { test } from "node:test";
import assert from "node:assert/strict";
import { parseArgs } from "../config.js";

test("parseArgs returns null with no arguments", () => {
  assert.equal(parseArgs([]), null);
});

test("parseArgs returns null on --help", () => {
  assert.equal(parseArgs(["--help"]), null);
});

test("parseArgs parses a decompose command", () => {
  const command = parseArgs(["decompose", "build", "a", "notification", "system", "--out", "plan.json"]);
  if (command?.command !== "decompose") throw new Error("expected decompose command");
  assert.equal(command.description, "build a notification system");
  assert.equal(command.out, "plan.json");
  assert.equal(command.json, false);
});

test("parseArgs requires a description for decompose", () => {
  assert.throws(() => parseArgs(["decompose"]), /needs a task description/);
});

test("parseArgs parses render with --tree", () => {
  const command = parseArgs(["render", "plan.json", "--tree"]);
  if (command?.command !== "render") throw new Error("expected render command");
  assert.equal(command.file, "plan.json");
  assert.equal(command.tree, true);
});

test("parseArgs requires a file for render", () => {
  assert.throws(() => parseArgs(["render"]), /needs a path/);
});

test("parseArgs parses validate", () => {
  const command = parseArgs(["validate", "plan.json"]);
  if (command?.command !== "validate") throw new Error("expected validate command");
  assert.equal(command.file, "plan.json");
});

test("parseArgs parses next with --done", () => {
  const command = parseArgs(["next", "plan.json", "--done", "schema,backend_service", "--json"]);
  if (command?.command !== "next") throw new Error("expected next command");
  assert.deepEqual(command.done, ["schema", "backend_service"]);
  assert.equal(command.json, true);
});

test("parseArgs defaults done to an empty list for next", () => {
  const command = parseArgs(["next", "plan.json"]);
  if (command?.command !== "next") throw new Error("expected next command");
  assert.deepEqual(command.done, []);
});

test("parseArgs rejects an unknown command", () => {
  assert.throws(() => parseArgs(["bogus"]), /unknown command/);
});

test("parseArgs rejects an unknown flag", () => {
  assert.throws(() => parseArgs(["decompose", "task", "--bogus"]), /unknown flag/);
});

test("parseArgs rejects an unknown flag for render", () => {
  assert.throws(() => parseArgs(["render", "plan.json", "--bogus"]), /unknown flag/);
});

test("parseArgs rejects an unknown flag for validate", () => {
  assert.throws(() => parseArgs(["validate", "plan.json", "--bogus"]), /unknown flag/);
});

test("parseArgs parses render with --tree before the file", () => {
  const command = parseArgs(["render", "--tree", "plan.json"]);
  if (command?.command !== "render") throw new Error("expected render command");
  assert.equal(command.file, "plan.json");
  assert.equal(command.tree, true);
});
