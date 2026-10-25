import type { TaskGraph, TaskNode } from "./schema.js";

export function nextTasks(graph: TaskGraph, completedIds: Set<string>): TaskNode[] {
  return graph.tasks.filter((task) => {
    if (completedIds.has(task.id)) return false;
    return task.dependsOn.every((dep) => completedIds.has(dep));
  });
}

export function isComplete(graph: TaskGraph, completedIds: Set<string>): boolean {
  return graph.tasks.every((task) => completedIds.has(task.id));
}

export function blockedTasks(graph: TaskGraph, completedIds: Set<string>): TaskNode[] {
  return graph.tasks.filter((task) => {
    if (completedIds.has(task.id)) return false;
    return !task.dependsOn.every((dep) => completedIds.has(dep));
  });
}

export function danglingDependencies(graph: TaskGraph): { taskId: string; missing: string }[] {
  const ids = new Set(graph.tasks.map((task) => task.id));
  const dangling: { taskId: string; missing: string }[] = [];
  for (const task of graph.tasks) {
    for (const dep of task.dependsOn) {
      if (!ids.has(dep)) dangling.push({ taskId: task.id, missing: dep });
    }
  }
  return dangling;
}
