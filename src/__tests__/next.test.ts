import { test } from "node:test";
import assert from "node:assert/strict";
import { nextTasks, blockedTasks, isComplete, danglingDependencies } from "../next.js";
import { sampleGraph, makeTask } from "./fixtures.js";

test("nextTasks returns every task with no dependencies when nothing is done yet", () => {
  const ready = nextTasks(sampleGraph(), new Set());
  assert.deepEqual(
    ready.map((task) => task.id).sort(),
    ["schema", "ui"],
  );
});

test("nextTasks unlocks a task once its dependency is done", () => {
  const ready = nextTasks(sampleGraph(), new Set(["schema"]));
  assert.deepEqual(
    ready.map((task) => task.id).sort(),
    ["backend_service", "ui"],
  );
});

test("nextTasks requires every dependency to be done, not just some", () => {
  const ready = nextTasks(sampleGraph(), new Set(["schema", "backend_service"]));
  assert.deepEqual(
    ready.map((task) => task.id).sort(),
    ["ui"],
  );
});

test("nextTasks excludes tasks that are already done", () => {
  const ready = nextTasks(sampleGraph(), new Set(["schema"]));
  assert.ok(!ready.some((task) => task.id === "schema"));
});

test("nextTasks returns the final task once everything it depends on is done", () => {
  const ready = nextTasks(sampleGraph(), new Set(["schema", "backend_service", "ui"]));
  assert.deepEqual(ready.map((task) => task.id), ["integration_tests"]);
});

test("blockedTasks lists tasks whose dependencies aren't all satisfied", () => {
  const blocked = blockedTasks(sampleGraph(), new Set());
  assert.deepEqual(
    blocked.map((task) => task.id).sort(),
    ["backend_service", "integration_tests"],
  );
});

test("isComplete is false until every task is done and true once they are", () => {
  const graph = sampleGraph();
  assert.equal(isComplete(graph, new Set(["schema"])), false);
  assert.equal(isComplete(graph, new Set(graph.tasks.map((task) => task.id))), true);
});

test("danglingDependencies finds a reference to a task id that doesn't exist", () => {
  const graph = { title: "t", tasks: [makeTask({ id: "a", dependsOn: ["ghost"] })] };
  const dangling = danglingDependencies(graph);
  assert.deepEqual(dangling, [{ taskId: "a", missing: "ghost" }]);
});

test("danglingDependencies returns nothing for a well-formed graph", () => {
  assert.deepEqual(danglingDependencies(sampleGraph()), []);
});

test("a task with a dangling dependency never becomes ready, but is reported by danglingDependencies", () => {
  const graph = { title: "t", tasks: [makeTask({ id: "a", dependsOn: ["ghost"] })] };
  const ready = nextTasks(graph, new Set());
  const blocked = blockedTasks(graph, new Set());
  assert.deepEqual(ready, []);
  assert.equal(blocked.length, 1);
  assert.equal(danglingDependencies(graph).length, 1);
});
