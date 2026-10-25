import { test } from "node:test";
import assert from "node:assert/strict";
import { validateGraph, isValid } from "../validate.js";
import { makeTask, sampleGraph } from "./fixtures.js";

test("validateGraph accepts a well-formed graph", () => {
  assert.deepEqual(validateGraph(sampleGraph()), []);
  assert.equal(isValid(sampleGraph()), true);
});

test("validateGraph catches a duplicate task id", () => {
  const graph = { title: "t", tasks: [makeTask({ id: "a" }), makeTask({ id: "a" })] };
  const issues = validateGraph(graph);
  assert.ok(issues.some((issue) => issue.message.includes("duplicate task id")));
});

test("validateGraph catches a dependency on an unknown task", () => {
  const graph = { title: "t", tasks: [makeTask({ id: "a", dependsOn: ["ghost"] })] };
  const issues = validateGraph(graph);
  assert.ok(issues.some((issue) => issue.message.includes('unknown task "ghost"')));
});

test("validateGraph catches a task that depends on itself", () => {
  const graph = { title: "t", tasks: [makeTask({ id: "a", dependsOn: ["a"] })] };
  const issues = validateGraph(graph);
  assert.ok(issues.some((issue) => issue.message.includes("depends on itself")));
});

test("validateGraph catches a real dependency cycle", () => {
  const graph = {
    title: "t",
    tasks: [makeTask({ id: "a", dependsOn: ["b"] }), makeTask({ id: "b", dependsOn: ["a"] })],
  };
  const issues = validateGraph(graph);
  assert.ok(issues.some((issue) => issue.message.startsWith("dependency cycle")));
});

test("validateGraph catches a longer cycle across three tasks", () => {
  const graph = {
    title: "t",
    tasks: [
      makeTask({ id: "a", dependsOn: ["c"] }),
      makeTask({ id: "b", dependsOn: ["a"] }),
      makeTask({ id: "c", dependsOn: ["b"] }),
    ],
  };
  assert.equal(isValid(graph), false);
});

test("validateGraph requires every task to list at least one file", () => {
  const graph = { title: "t", tasks: [makeTask({ id: "a", files: [] })] };
  const issues = validateGraph(graph);
  assert.ok(issues.some((issue) => issue.message.includes("no files listed")));
});

test("validateGraph requires every task to have acceptance criteria", () => {
  const graph = { title: "t", tasks: [makeTask({ id: "a", acceptanceCriteria: [] })] };
  const issues = validateGraph(graph);
  assert.ok(issues.some((issue) => issue.message.includes("no acceptance criteria")));
});

test("validateGraph reports a self-loop only once, not twice", () => {
  const graph = { title: "t", tasks: [makeTask({ id: "a", dependsOn: ["a"] })] };
  const issues = validateGraph(graph);
  const cycleMentions = issues.filter((issue) => issue.message.includes("a") && issue.message.includes("cycle"));
  assert.equal(cycleMentions.length, 0);
  assert.equal(issues.filter((issue) => issue.message.includes("depends on itself")).length, 1);
});

test("validateGraph still catches a real cycle elsewhere when an unrelated task has a self-loop", () => {
  const graph = {
    title: "t",
    tasks: [
      makeTask({ id: "a", dependsOn: ["a"] }),
      makeTask({ id: "b", dependsOn: ["c"] }),
      makeTask({ id: "c", dependsOn: ["b"] }),
    ],
  };
  const issues = validateGraph(graph);
  assert.ok(issues.some((issue) => issue.message.includes("depends on itself")));
  assert.ok(issues.some((issue) => issue.message.startsWith("dependency cycle")));
});

test("validateGraph doesn't false-positive a cycle in a diamond-shaped dependency graph", () => {
  const graph = {
    title: "t",
    tasks: [
      makeTask({ id: "root" }),
      makeTask({ id: "left", dependsOn: ["root"] }),
      makeTask({ id: "right", dependsOn: ["root"] }),
      makeTask({ id: "join", dependsOn: ["left", "right"] }),
    ],
  };
  assert.equal(isValid(graph), true);
});
