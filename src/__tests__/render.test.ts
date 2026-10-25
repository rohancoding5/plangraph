import { test } from "node:test";
import assert from "node:assert/strict";
import { formatTree, formatSummary } from "../render.js";
import { sampleGraph, makeTask } from "./fixtures.js";

test("formatTree groups tasks under their parent label", () => {
  const output = formatTree(sampleGraph());
  assert.match(output, /Notification System/);
  assert.match(output, /Database/);
  assert.match(output, /schema \(schema\)/);
  assert.match(output, /Tests/);
});

test("formatTree marks the last group and last task in each group differently", () => {
  const output = formatTree(sampleGraph());
  assert.match(output, /└─ Tests/);
});

test("formatSummary lists files, dependencies, and acceptance criteria for each task", () => {
  const output = formatSummary(sampleGraph());
  assert.match(output, /TASK GRAPH: Notification System/);
  assert.match(output, /files: prisma\/schema\.prisma/);
  assert.match(output, /depends on: schema, backend_service, ui/);
  assert.match(output, /acceptance:/);
});

test("formatSummary shows (none) for a task with no dependencies", () => {
  const output = formatSummary(sampleGraph());
  assert.match(output, /depends on: \(none\)/);
});

test("formatSummary shows context when a task has some", () => {
  const graph = {
    title: "t",
    tasks: [makeTask({ id: "a", context: "existing endpoints use camelCase, keep that convention" })],
  };
  const output = formatSummary(graph);
  assert.match(output, /context: existing endpoints use camelCase, keep that convention/);
});

test("formatSummary omits the context line for a task with none", () => {
  const output = formatSummary(sampleGraph());
  assert.doesNotMatch(output, /context:/);
});

test("formatTree treats parent labels that differ only in case or whitespace as one group", () => {
  const graph = {
    title: "t",
    tasks: [makeTask({ id: "a", parent: "Backend" }), makeTask({ id: "b", parent: "backend " })],
  };
  const output = formatTree(graph);
  const backendMentions = output.split("\n").filter((line) => /backend/i.test(line) && !line.includes("(")).length;
  assert.equal(backendMentions, 1);
});

test("formatSummary uses the first-seen casing as the group label", () => {
  const graph = {
    title: "t",
    tasks: [makeTask({ id: "a", parent: "Backend" }), makeTask({ id: "b", parent: "BACKEND" })],
  };
  const output = formatSummary(graph);
  assert.match(output, /^Backend$/m);
});
