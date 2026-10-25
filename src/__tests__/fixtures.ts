import type { TaskGraph, TaskNode } from "../schema.js";

export function makeTask(overrides: Partial<TaskNode> & { id: string }): TaskNode {
  return {
    title: overrides.id,
    parent: "General",
    dependsOn: [],
    files: ["src/placeholder.ts"],
    acceptanceCriteria: ["it does the thing"],
    tests: [],
    constraints: [],
    context: "",
    ...overrides,
  };
}

export function sampleGraph(): TaskGraph {
  return {
    title: "Notification System",
    tasks: [
      makeTask({ id: "schema", parent: "Database", files: ["prisma/schema.prisma"] }),
      makeTask({
        id: "backend_service",
        parent: "Backend",
        dependsOn: ["schema"],
        files: ["src/notifications/service.ts"],
      }),
      makeTask({ id: "ui", parent: "Frontend", files: ["src/components/NotificationBell.tsx"] }),
      makeTask({
        id: "integration_tests",
        parent: "Tests",
        dependsOn: ["schema", "backend_service", "ui"],
        files: ["tests/notifications.test.ts"],
      }),
    ],
  };
}
