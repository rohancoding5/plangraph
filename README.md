# plangraph

Turns a vague engineering request into a dependency graph of small tasks with files, acceptance criteria, tests, and constraints.

```bash
plangraph decompose "build a notification system" --out plan.json
plangraph render plan.json --tree
```

```
Notification System
├─ Database
│  └─ Add notification tables to the schema (schema)
├─ Backend
│  └─ Build the notification service (backend_service)
├─ Frontend
│  └─ Add the notification bell to the header (ui)
└─ Tests
   └─ End to end notification flow test (integration_tests)
```

## Why this exists

"Make an AI agent plan the work first" isn't the hard part, most agents will happily generate a plan. The hard part is whether that plan is actually usable: does each step have real files, a real way to check it's done, and a real place in the order of things, or is it just a bulleted list dressed up as a plan. This asks Claude to break a task down into a real dependency graph instead of a paragraph, validates the result structurally (no cycles, no dangling dependencies, nothing missing the fields an agent would actually need), and gives you a way to ask "what can run right now" so independent branches of the plan can be worked in parallel instead of one at a time.

## Install

Not published to npm yet, so clone and run it directly:

```bash
git clone https://github.com/rohancoding5/plangraph.git
cd plangraph
npm install
npm run build
node dist/cli.js decompose "<task>"
```

Set `ANTHROPIC_API_KEY` for `decompose`. Everything else works on a saved plan without needing a key at all.

## Commands

```bash
plangraph decompose "add stripe subscriptions" --out plan.json
```

Sends the task to Claude, asking for a structured breakdown: every task gets a unique id, a parent group for display, the files it touches, real acceptance criteria, tests, constraints, and which other tasks it depends on. The result gets validated before you ever see it, if Claude's plan has a dependency cycle, a task with no files, or a reference to a task id that doesn't exist, `decompose` reports that instead of silently handing you a broken plan.

```bash
plangraph render plan.json
plangraph render plan.json --tree
```

Prints a saved plan. The default view shows every task's full detail, files, dependencies, acceptance criteria, tests, constraints. `--tree` prints the grouped structure only, closer to a project outline than a spec.

```bash
plangraph next plan.json --done schema,ui
```

Given a set of task ids that are already finished, prints which tasks have every dependency satisfied and are ready to start right now, and which ones are still blocked and on what. This is the part that actually enables parallel execution: hand the "ready" list to however many agents you've got running, and call `next` again with the updated done list once they finish.

```bash
plangraph validate plan.json
```

Checks a plan for structural problems without rendering or running anything: duplicate ids, dependencies on tasks that don't exist, tasks that depend on themselves, real cycles (using a real topological check, not just an eyeball), and tasks missing files or acceptance criteria.

### Options

```
--out <file>       decompose only, save the graph to a file instead of printing it
--tree             render only, print the grouped tree instead of full detail
--done <ids>        next only, comma separated ids of tasks already finished
--json              decompose and next only, print machine-readable JSON
--help             show this message
```

## Known limitations

`decompose` is the one command that needs a real API call, it's asking an LLM to do real judgment about how to break work down, and there's no mechanical substitute for that. Everything downstream of a saved plan, `render`, `validate`, `next`, works entirely offline against the JSON file, so a plan is fully portable and inspectable without needing to hit the API again.

Validation checks structure, not quality. A plan can be perfectly valid, no cycles, every field present, and still describe a bad breakdown of the work. Read the plan before handing it to agents.

## Development

```bash
git clone https://github.com/rohancoding5/plangraph.git
cd plangraph
npm install
npm test
```

`npm test` builds the project and runs the full suite with Node's built-in test runner: unit tests for the cycle detector (including a diamond-shaped dependency graph that a naive detector would wrongly flag as a cycle), the ready/blocked task calculation, the tree and summary renderers, and CLI argument parsing, plus a test that runs the real Anthropic SDK's structured-output parsing against a local HTTP server standing in for the Messages API, so the actual request shape and response parsing get exercised, not just the logic wrapped around them.

## License

MIT
