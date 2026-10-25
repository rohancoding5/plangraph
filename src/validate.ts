import type { TaskGraph } from "./schema.js";

export type ValidationIssue = {
  taskId?: string;
  message: string;
};

function findCycle(graph: TaskGraph): string[] | null {
  const byId = new Map(graph.tasks.map((task) => [task.id, task]));
  const state = new Map<string, "visiting" | "done">();
  const path: string[] = [];

  function visit(id: string): string[] | null {
    const status = state.get(id);
    if (status === "done") return null;
    if (status === "visiting") {
      const cycleStart = path.indexOf(id);
      return [...path.slice(cycleStart), id];
    }

    state.set(id, "visiting");
    path.push(id);

    const task = byId.get(id);
    if (task) {
      for (const dep of task.dependsOn) {
        if (dep === id) continue;
        if (!byId.has(dep)) continue;
        const result = visit(dep);
        if (result) return result;
      }
    }

    path.pop();
    state.set(id, "done");
    return null;
  }

  for (const task of graph.tasks) {
    const result = visit(task.id);
    if (result) return result;
  }

  return null;
}

export function validateGraph(graph: TaskGraph): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();

  for (const task of graph.tasks) {
    if (ids.has(task.id)) {
      issues.push({ taskId: task.id, message: `duplicate task id "${task.id}"` });
    }
    ids.add(task.id);
  }

  for (const task of graph.tasks) {
    for (const dep of task.dependsOn) {
      if (dep === task.id) {
        issues.push({ taskId: task.id, message: `task "${task.id}" depends on itself` });
        continue;
      }
      if (!ids.has(dep)) {
        issues.push({ taskId: task.id, message: `task "${task.id}" depends on unknown task "${dep}"` });
      }
    }
    if (task.files.length === 0) {
      issues.push({ taskId: task.id, message: `task "${task.id}" has no files listed` });
    }
    if (task.acceptanceCriteria.length === 0) {
      issues.push({ taskId: task.id, message: `task "${task.id}" has no acceptance criteria` });
    }
  }

  const cycle = findCycle(graph);
  if (cycle) {
    issues.push({ message: `dependency cycle: ${cycle.join(" -> ")}` });
  }

  return issues;
}

export function isValid(graph: TaskGraph): boolean {
  return validateGraph(graph).length === 0;
}
