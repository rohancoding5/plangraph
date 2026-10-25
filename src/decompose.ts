import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { TaskGraphSchema, type TaskGraph } from "./schema.js";

const SYSTEM_PROMPT = `You break a vague engineering task into a dependency graph of small, concrete, independently verifiable subtasks that an AI coding agent could pick up and execute on its own.

Rules for every task:
- Give it a short, unique, lowercase snake_case id.
- Give it a real, specific list of files it should touch or create, not a vague area.
- Give it concrete acceptance criteria, things that can actually be checked, not vague goals.
- List real tests it needs, either new tests to write or existing ones it must keep passing.
- List any real constraints, things it must not do, or must be compatible with.
- Set dependsOn to the ids of tasks that must be done first. A task with no real prerequisites gets an empty array.
- Group related tasks under a short parent label like "Database", "Backend", "Frontend", "Tests", so they can be shown together.
- Prefer more, smaller tasks over fewer, vague ones. Each task should be small enough that a single focused work session could finish it.
- Fill in context with whatever background an agent would need but wouldn't get from the files or acceptance criteria alone: an existing convention to follow, a decision already made elsewhere, an edge case to watch for. Leave it an empty string only if there's genuinely nothing extra to say.`;

export async function decompose(
  taskDescription: string,
  clientOptions?: ConstructorParameters<typeof Anthropic>[0],
): Promise<TaskGraph> {
  const client = new Anthropic(clientOptions);
  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `Break this down: ${taskDescription}` }],
    output_config: { format: zodOutputFormat(TaskGraphSchema) },
  });

  if (!response.parsed_output) {
    throw new Error("claude didn't return a task graph in the expected shape");
  }

  return response.parsed_output;
}
