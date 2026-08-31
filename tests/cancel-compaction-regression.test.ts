import { expect, test } from "bun:test";
import type { BrowserTurn } from "../src/adapters/chatgpt-web/browser-worker";
import { requestRetainedCompactionHandoff } from "../src/adapters/chatgpt-web/compaction-handoff";
import {
  ChatGptTextFeed,
  ChatGptTraceFeed,
  ChatGptTurnSession,
  ChatGptTurnSessions,
} from "../src/adapters/chatgpt-web/turn-execution";
import type { TurnBroker } from "../src/adapters/chatgpt-web/turn-broker";
import type { CodexParsedRequest } from "../src/types";

function parsedRequest(): CodexParsedRequest {
  return {
    modelId: "gpt-5.6-sol",
    stream: true,
    context: {
      messages: [{ role: "user", content: "Continue the task", timestamp: 1 }],
    },
    options: { reasoning: "high" },
    _compactionRequest: true,
    _rawBody: {
      input: [{
        type: "message",
        role: "user",
        content: [{ type: "input_text", text: "Continue the task" }],
        internal_chat_message_metadata_passthrough: { turn_id: "turn_source" },
      }],
      client_metadata: {
        "x-codex-turn-metadata": JSON.stringify({
          thread_id: "thread_cancel_compaction_regression",
          turn_id: "turn_compact",
        }),
      },
    },
  };
}

test("structured compaction handoff wins over a late assistant-DOM binding failure", async () => {
  const source = new ChatGptTurnSession({
    mode: "read-only",
    browser: Promise.resolve("source complete"),
    physicalSettlement: Promise.resolve(),
    trace: new ChatGptTraceFeed(),
    text: new ChatGptTextFeed(),
    conversationKey: "a".repeat(64),
    cancel() {},
  });
  let browserAborted = false;
  const broker = {
    beginCompactionTransaction: async () => ({
      token: "control_11111111111111111111111111111111",
      handoffId: "handoff_22222222222222222222222222222222",
    }),
    waitForCompactionHandoff: async () => "Structured checkpoint",
    abortCompactionTransaction() {},
  } as unknown as TurnBroker;
  const worker = {
    run: async (turn: BrowserTurn): Promise<string> => {
      const prepared = await turn.prepareResume!();
      prepared.release();
      return await new Promise<string>((_resolve, reject) => {
        const fail = () => {
          browserAborted = true;
          reject(new Error("ChatGPT accepted the message but did not expose its assistant turn in the DOM"));
        };
        if (turn.abortSignal?.aborted) fail();
        else turn.abortSignal?.addEventListener("abort", fail, { once: true });
      });
    },
  };

  await expect(requestRetainedCompactionHandoff(
    worker as never,
    parsedRequest(),
    source,
    broker,
    { localToolsEnabled: true, solAvailable: true, proAvailable: true },
    "trace_structured_handoff",
  )).resolves.toBe("Structured checkpoint");
  expect(browserAborted).toBeTrue();
});

test("a new semantic revision supersedes an observer-detached same-thread browser turn", async () => {
  const sessions = new ChatGptTurnSessions();
  let settlePhysical!: () => void;
  const physicalSettlement = new Promise<void>(resolve => { settlePhysical = resolve; });
  let cancellations = 0;
  const old = sessions.getOrCreate("old-execution", () => ({
    mode: "read-only",
    browser: new Promise<string>(() => {}),
    physicalSettlement,
    trace: new ChatGptTraceFeed(),
    text: new ChatGptTextFeed(),
    cancel() {
      cancellations += 1;
      settlePhysical();
    },
  }), "old_trace", "same_thread");

  await expect(old.runExclusive(async () => {
    throw new DOMException("observer disconnected", "AbortError");
  })).rejects.toMatchObject({ name: "AbortError" });

  let starts = 0;
  const replacement = await sessions.getOrCreateAfterOwnerRetirement(
    "new-execution",
    "same_thread",
    () => {
      starts += 1;
      return {
        mode: "read-only" as const,
        browser: Promise.resolve("new result"),
        physicalSettlement: Promise.resolve(),
        trace: new ChatGptTraceFeed(),
        text: new ChatGptTextFeed(),
        cancel() {},
      };
    },
    "new_trace",
  );

  expect(cancellations).toBe(1);
  expect(starts).toBe(1);
  expect(sessions.find("old-execution")).toBeUndefined();
  expect(replacement).toBe(sessions.find("new-execution"));
  sessions.clear();
});
