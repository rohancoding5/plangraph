#!/usr/bin/env node
import { readFile, writeFile } from "fs/promises";
import { parseArgs } from "./config.js";
import { decompose } from "./decompose.js";
import { TaskGraphSchema, type TaskGraph } from "./schema.js";
import { validateGraph } from "./validate.js";
import { nextTasks, blockedTasks, danglingDependencies } from "./next.js";
import { formatTree, formatSummary } from "./render.js";

async function loadGraph(path: string): Promise<TaskGraph> {
  const raw = await readFile(path, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`"${path}" isn't valid JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
  const result = TaskGraphSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`"${path}" isn't a valid task graph: ${result.error.issues[0]?.message ?? "unknown error"}`);
  }
  return result.data;
}

async function runDecompose(command: Extract<ReturnType<typeof parseArgs>, { command: "decompose" }>): Promise<void> {
  const graph = await decompose(command.description);
  const issues = validateGraph(graph);

  if (issues.length > 0) {
    console.error("claude's task graph has structural problems:");
    for (const issue of issues) console.error(`  ${issue.taskId ? `[${issue.taskId}] ` : ""}${issue.message}`);
    process.exitCode = 1;
    return;
  }

  if (command.out) {
    await writeFile(command.out, JSON.stringify(graph, null, 2));
    console.log(`saved ${graph.tasks.length} tasks to ${command.out}`);
    return;
  }

  if (command.json) {
    console.log(JSON.stringify(graph, null, 2));
    return;
  }

  console.log(formatSummary(graph));
}

async function runRender(command: Extract<ReturnType<typeof parseArgs>, { command: "render" }>): Promise<void> {
  const graph = await loadGraph(command.file);
  console.log(command.tree ? formatTree(graph) : formatSummary(graph));
}

async function runValidate(command: Extract<ReturnType<typeof parseArgs>, { command: "validate" }>): Promise<void> {
  const graph = await loadGraph(command.file);
  const issues = validateGraph(graph);

  if (issues.length === 0) {
    console.log(`${command.file} is valid: ${graph.tasks.length} tasks, no structural problems.`);
    return;
  }

  console.log(`${command.file} has ${issues.length} problem${issues.length === 1 ? "" : "s"}:`);
  for (const issue of issues) console.log(`  ${issue.taskId ? `[${issue.taskId}] ` : ""}${issue.message}`);
  process.exitCode = 1;
}

async function runNext(command: Extract<ReturnType<typeof parseArgs>, { command: "next" }>): Promise<void> {
  const graph = await loadGraph(command.file);
  const completed = new Set(command.done);
  const ready = nextTasks(graph, completed);
  const blocked = blockedTasks(graph, completed);
  const dangling = danglingDependencies(graph);

  if (command.json) {
    console.log(
      JSON.stringify(
        {
          ready: ready.map((task) => task.id),
          blocked: blocked.map((task) => task.id),
          done: graph.tasks.length - ready.length - blocked.length,
          total: graph.tasks.length,
          danglingDependencies: dangling,
        },
        null,
        2,
      ),
    );
    return;
  }

  if (dangling.length > 0) {
    console.log(`warning: ${dangling.length} task(s) depend on ids that don't exist in this graph, run "validate" for details:`);
    for (const entry of dangling) console.log(`  ${entry.taskId} depends on missing "${entry.missing}"`);
    console.log("");
  }

  if (ready.length === 0 && blocked.length === 0) {
    console.log("every task is done.");
    return;
  }

  console.log(`ready to run now (${ready.length}):`);
  for (const task of ready) console.log(`  ${task.title} (${task.id})`);

  if (blocked.length > 0) {
    console.log(`\nstill blocked (${blocked.length}):`);
    for (const task of blocked) {
      const waitingOn = task.dependsOn.filter((dep) => !completed.has(dep));
      console.log(`  ${task.title} (${task.id})  waiting on: ${waitingOn.join(", ")}`);
    }
  }
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  let command: ReturnType<typeof parseArgs>;
  try {
    command = parseArgs(argv);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
    return;
  }
  if (!command) return;

  if (command.command === "decompose") await runDecompose(command);
  else if (command.command === "render") await runRender(command);
  else if (command.command === "validate") await runValidate(command);
  else await runNext(command);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
