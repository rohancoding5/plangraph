import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { decompose } from "../decompose.js";
import { sampleGraph } from "./fixtures.js";

function startFakeMessagesServer(payload: unknown): Promise<{ server: Server; url: string; requests: unknown[] }> {
  const requests: unknown[] = [];
  return new Promise((resolvePromise) => {
    const server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        requests.push(JSON.parse(Buffer.concat(chunks).toString("utf8")));
        res.writeHead(200, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            id: "msg_1",
            type: "message",
            role: "assistant",
            model: "claude-opus-5",
            stop_reason: "end_turn",
            stop_sequence: null,
            content: [{ type: "text", text: JSON.stringify(payload) }],
            usage: { input_tokens: 40, output_tokens: 120 },
          }),
        );
      });
    });
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolvePromise({ server, url: `http://127.0.0.1:${port}`, requests });
    });
  });
}

test("decompose sends the task description and parses a real structured task graph back", async () => {
  const { server, url, requests } = await startFakeMessagesServer(sampleGraph());
  try {
    const graph = await decompose("build a notification system", { apiKey: "test-key", baseURL: url });

    assert.equal(graph.title, "Notification System");
    assert.equal(graph.tasks.length, 4);
    assert.ok(graph.tasks.some((task) => task.id === "schema"));

    const sent = requests[0] as { model: string; messages: { content: string }[]; system: string };
    assert.equal(sent.model, "claude-opus-5");
    assert.match(sent.messages[0].content, /build a notification system/);
    assert.match(sent.system, /dependsOn/);
    assert.match(sent.system, /context/);
  } finally {
    server.close();
  }
});

test("decompose throws when claude's response doesn't match the schema", async () => {
  const { server, url } = await startFakeMessagesServer({ notEvenCloseToTheSchema: true });
  try {
    await assert.rejects(
      () => decompose("build something", { apiKey: "test-key", baseURL: url }),
      /title|tasks/,
    );
  } finally {
    server.close();
  }
});
