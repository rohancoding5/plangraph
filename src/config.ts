export type Command =
  | { command: "decompose"; description: string; out?: string; json: boolean }
  | { command: "render"; file: string; tree: boolean }
  | { command: "validate"; file: string }
  | { command: "next"; file: string; done: string[]; json: boolean };

function printHelp(): void {
  console.log(`plangraph <decompose|render|validate|next> ...

turns a vague engineering ask into a dependency graph of small, concrete,
agent-ready tasks, each with real files, acceptance criteria, tests, and
constraints, instead of one giant ambiguous task.

  decompose "<description>"   ask claude to break the task down (needs ANTHROPIC_API_KEY)
  render <file>                 print a saved task graph
  validate <file>                check a task graph for structural problems
  next <file>                    show which tasks are ready to run right now

  --out <file>                   decompose only, save the graph to a file instead of printing it
  --tree                         render only, print a simple grouped tree instead of full detail
  --done <ids>                    next only, comma separated ids of tasks already finished
  --json                          decompose and next only, print machine-readable JSON
  --help                         show this message

examples:
  plangraph decompose "build a notification system" --out plan.json
  plangraph render plan.json --tree
  plangraph next plan.json --done database_schema,backend_service
`);
}

export function parseArgs(argv: string[]): Command | null {
  if (argv.length === 0 || argv.includes("--help")) {
    printHelp();
    return null;
  }

  const [command, ...rest] = argv;

  function next(flag: string, i: number): string {
    const value = rest[i + 1];
    if (value === undefined) throw new Error(`${flag} needs a value`);
    return value;
  }

  if (command === "decompose") {
    const positional: string[] = [];
    let out: string | undefined;
    let json = false;

    for (let i = 0; i < rest.length; i++) {
      const arg = rest[i];
      if (arg === "--out") {
        out = next(arg, i);
        i += 1;
      } else if (arg === "--json") {
        json = true;
      } else if (arg.startsWith("--")) {
        throw new Error(`unknown flag "${arg}"`);
      } else {
        positional.push(arg);
      }
    }

    const description = positional.join(" ").trim();
    if (!description) throw new Error("decompose needs a task description");
    return { command: "decompose", description, out, json };
  }

  if (command === "render") {
    const positional: string[] = [];
    let tree = false;

    for (const arg of rest) {
      if (arg === "--tree") {
        tree = true;
      } else if (arg.startsWith("--")) {
        throw new Error(`unknown flag "${arg}"`);
      } else {
        positional.push(arg);
      }
    }

    const file = positional[0];
    if (!file) throw new Error("render needs a path to a task graph file");
    return { command: "render", file, tree };
  }

  if (command === "validate") {
    const positional: string[] = [];

    for (const arg of rest) {
      if (arg.startsWith("--")) {
        throw new Error(`unknown flag "${arg}"`);
      } else {
        positional.push(arg);
      }
    }

    const file = positional[0];
    if (!file) throw new Error("validate needs a path to a task graph file");
    return { command: "validate", file };
  }

  if (command === "next") {
    const positional: string[] = [];
    let done: string[] = [];
    let json = false;

    for (let i = 0; i < rest.length; i++) {
      const arg = rest[i];
      if (arg === "--done") {
        done = next(arg, i)
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);
        i += 1;
      } else if (arg === "--json") {
        json = true;
      } else if (arg.startsWith("--")) {
        throw new Error(`unknown flag "${arg}"`);
      } else {
        positional.push(arg);
      }
    }

    const file = positional[0];
    if (!file) throw new Error("next needs a path to a task graph file");
    return { command: "next", file, done, json };
  }

  throw new Error(`unknown command "${command}", use "decompose", "render", "validate", or "next"`);
}
