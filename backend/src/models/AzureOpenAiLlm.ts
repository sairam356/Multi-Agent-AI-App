/**
 * AzureOpenAiLlm — custom model adapter bridging Google ADK TypeScript with Azure OpenAI.
 *
 * Extends ADK's abstract BaseLlm class and implements `generateContentAsync`.
 *
 * Important: ADK's error handler does JSON.parse(error.message), expecting the format:
 *   { "error": { "code": "...", "message": "..." } }
 * We wrap all thrown errors into this format so ADK surfaces them cleanly.
 *
 * Note: gpt-5.2-chat (and o-series models) do NOT support `temperature`.
 * We omit it to avoid 400 errors.
 */

import { BaseLlm } from '@google/adk';
import type { LlmRequest, LlmResponse } from '@google/adk';
import type { Content, Part } from '@google/genai';
import type { AzureOpenAI } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { getAzureClient, getDeploymentName } from '../config/azure-openai.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function partsToText(parts?: Part[]): string {
  return (parts ?? [])
    .filter((p) => typeof p.text === 'string')
    .map((p) => p.text ?? '')
    .join('');
}

function contentToOpenAiMessage(content: Content): ChatCompletionMessageParam | null {
  const role = content.role ?? 'user';
  const parts = content.parts ?? [];
  const text = partsToText(parts);

  if (role === 'model') {
    const fnCallPart = parts.find((p) => p.functionCall !== undefined);
    if (fnCallPart?.functionCall) {
      return {
        role: 'assistant',
        content: text || null,
        tool_calls: [
          {
            id: `call_${Date.now()}`,
            type: 'function',
            function: {
              name: fnCallPart.functionCall.name ?? '',
              arguments: JSON.stringify(fnCallPart.functionCall.args ?? {}),
            },
          },
        ],
      } as ChatCompletionMessageParam;
    }
    return { role: 'assistant', content: text || '' };
  }

  if (!text) return null;
  return { role: role === 'user' ? 'user' : 'system', content: text };
}

/**
 * Wraps any error into the JSON format ADK's error handler expects:
 *   { "error": { "code": "500", "message": "..." } }
 */
function toAdkError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);
  return new Error(JSON.stringify({ error: { code: '500', message: msg } }));
}

// ─── AzureOpenAiLlm ───────────────────────────────────────────────────────────

export class AzureOpenAiLlm extends BaseLlm {
  private readonly azureClient: AzureOpenAI;
  private readonly deployment: string;

  constructor() {
    const deployment = getDeploymentName();
    super({ model: `azure/${deployment}` });
    this.azureClient = getAzureClient();
    this.deployment = deployment;
  }

  /**
   * Primary method called by ADK. stream=true → yield partial chunks.
   * stream=false → yield a single complete response.
   *
   * gpt-5.2-chat does NOT support `temperature`, so we omit it entirely.
   */
  async *generateContentAsync(
    llmRequest: LlmRequest,
    stream = false
  ): AsyncGenerator<LlmResponse, void> {
    try {
      const messages = this.buildMessages(llmRequest);
      const tools = this.buildOpenAiTools(llmRequest);

      // Build base params — no temperature (unsupported by gpt-5.2-chat / o-series)
      const baseParams: Record<string, unknown> = {
        model: this.deployment,
        messages,
        max_completion_tokens: 2048,
      };

      if (tools.length > 0) {
        baseParams.tools = tools;
        baseParams.tool_choice = 'auto';
      }

      if (stream) {
        const streamResponse = await this.azureClient.chat.completions.create({
          ...(baseParams as Parameters<typeof this.azureClient.chat.completions.create>[0]),
          stream: true,
        });

        let accumulated = '';
        let receivedFinish = false;

        for await (const chunk of streamResponse) {
          const delta = chunk.choices[0]?.delta?.content ?? '';
          const finishReason = chunk.choices[0]?.finish_reason;
          const isDone = finishReason !== null && finishReason !== undefined;

          accumulated += delta;

          if (delta || isDone) {
            yield {
              content: { role: 'model', parts: [{ text: accumulated }] },
              partial: !isDone,
              turnComplete: isDone,
            };
          }

          if (isDone) { receivedFinish = true; break; }
        }

        // Safety: emit a final response if stream ended without a finish_reason
        if (!receivedFinish && accumulated) {
          yield {
            content: { role: 'model', parts: [{ text: accumulated }] },
            partial: false,
            turnComplete: true,
          };
        }
      } else {
        const response = await this.azureClient.chat.completions.create({
          ...(baseParams as Parameters<typeof this.azureClient.chat.completions.create>[0]),
          stream: false,
        });

        const choice = response.choices[0];
        const text = choice?.message?.content ?? '';
        const fnCall = choice?.message?.tool_calls?.[0];

        if (fnCall) {
          let args: Record<string, unknown> = {};
          try { args = JSON.parse(fnCall.function.arguments || '{}') as Record<string, unknown>; } catch { /* leave empty */ }

          yield {
            content: {
              role: 'model',
              parts: [{ functionCall: { name: fnCall.function.name, args } }],
            },
            partial: false,
            turnComplete: true,
          };
        } else {
          yield {
            content: { role: 'model', parts: [{ text }] },
            partial: false,
            turnComplete: true,
          };
        }
      }
    } catch (err) {
      // Re-throw in the JSON format ADK's error handler expects
      throw toAdkError(err);
    }
  }

  /** Required by BaseLlm; live connections not supported with Azure OpenAI. */
  // eslint-disable-next-line @typescript-eslint/require-await
  async connect(_llmRequest: LlmRequest): Promise<never> {
    throw toAdkError(new Error('AzureOpenAiLlm does not support live connections'));
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private buildMessages(request: LlmRequest): ChatCompletionMessageParam[] {
    const messages: ChatCompletionMessageParam[] = [];

    const config = request.config as { systemInstruction?: Content } | undefined;
    if (config?.systemInstruction) {
      const text = partsToText(config.systemInstruction.parts);
      if (text) messages.push({ role: 'system', content: text });
    }

    for (const content of request.contents ?? []) {
      const msg = contentToOpenAiMessage(content);
      if (msg) messages.push(msg);
    }

    return messages;
  }

  private buildOpenAiTools(
    request: LlmRequest
  ): Array<{ type: 'function'; function: { name: string; description?: string; parameters?: unknown } }> {
    const toolsDict = request.toolsDict ?? {};
    const result: Array<{ type: 'function'; function: { name: string; description?: string; parameters?: unknown } }> = [];

    for (const tool of Object.values(toolsDict)) {
      try {
        const decl = (tool as { _getDeclaration(): { name: string; description?: string; parameters?: unknown } })._getDeclaration();
        if (decl?.name) {
          result.push({
            type: 'function',
            function: {
              name: decl.name,
              description: decl.description,
              parameters: decl.parameters ?? { type: 'object', properties: {} },
            },
          });
        }
      } catch { /* skip */ }
    }

    return result;
  }
}
