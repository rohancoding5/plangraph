import type { TaskGraph, TaskNode } from "./schema.js";

function normalizeParentKey(parent: string): string {
  return parent.trim().toLowerCase();
}

function groupByParent(tasks: TaskNode[]): Map<string, { label: string; tasks: TaskNode[] }> {
  const groups = new Map<string, { label: string; tasks: TaskNode[] }>();
  for (const task of tasks) {
    const key = normalizeParentKey(task.parent);
    const group = groups.get(key) ?? { label: task.parent.trim(), tasks: [] };
    group.tasks.push(task);
    groups.set(key, group);
  }
  return groups;
}

export function formatTree(graph: TaskGraph): string {
  const lines: string[] = [graph.title];
  const groups = [...groupByParent(graph.tasks).values()];

  groups.forEach(({ label, tasks }, groupIndex) => {
    const isLastGroup = groupIndex === groups.length - 1;
    lines.push(`${isLastGroup ? "└─" : "├─"} ${label}`);
    const prefix = isLastGroup ? "   " : "│  ";
    tasks.forEach((task, taskIndex) => {
      const isLastTask = taskIndex === tasks.length - 1;
      lines.push(`${prefix}${isLastTask ? "└─" : "├─"} ${task.title} (${task.id})`);
    });
  });

  return lines.join("\n");
}

export function formatSummary(graph: TaskGraph): string {
  const lines: string[] = [`TASK GRAPH: ${graph.title}`, ""];
  const groups = groupByParent(graph.tasks);

  for (const { label, tasks } of groups.values()) {
    lines.push(label);
    for (const task of tasks) {
      lines.push(`  ${task.title} (${task.id})`);
      if (task.files.length > 0) lines.push(`    files: ${task.files.join(", ")}`);
      lines.push(`    depends on: ${task.dependsOn.length > 0 ? task.dependsOn.join(", ") : "(none)"}`);
      if (task.context.trim().length > 0) lines.push(`    context: ${task.context}`);
      if (task.acceptanceCriteria.length > 0) {
        lines.push("    acceptance:");
        for (const criterion of task.acceptanceCriteria) lines.push(`      - ${criterion}`);
      }
      if (task.tests.length > 0) {
        lines.push("    tests:");
        for (const testItem of task.tests) lines.push(`      - ${testItem}`);
      }
      if (task.constraints.length > 0) {
        lines.push("    constraints:");
        for (const constraint of task.constraints) lines.push(`      - ${constraint}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
