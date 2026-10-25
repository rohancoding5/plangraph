import { z } from "zod";

export const TaskNodeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  parent: z.string().min(1),
  dependsOn: z.array(z.string()),
  files: z.array(z.string()),
  acceptanceCriteria: z.array(z.string()),
  tests: z.array(z.string()),
  constraints: z.array(z.string()),
  context: z.string(),
});

export const TaskGraphSchema = z.object({
  title: z.string().min(1),
  tasks: z.array(TaskNodeSchema).min(1),
});

export type TaskNode = z.infer<typeof TaskNodeSchema>;
export type TaskGraph = z.infer<typeof TaskGraphSchema>;
