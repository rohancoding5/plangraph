import { test } from "node:test";
import assert from "node:assert/strict";
import { TaskNodeSchema } from "../schema.js";
import { makeTask } from "./fixtures.js";

test("TaskNodeSchema rejects an empty parent label", () => {
  const result = TaskNodeSchema.safeParse(makeTask({ id: "a", parent: "" }));
  assert.equal(result.success, false);
});

test("TaskNodeSchema accepts a real parent label", () => {
  const result = TaskNodeSchema.safeParse(makeTask({ id: "a", parent: "Backend" }));
  assert.equal(result.success, true);
});
