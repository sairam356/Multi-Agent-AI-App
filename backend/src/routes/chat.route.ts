/**
 * POST /api/chat — non-streaming chat endpoint.
 * Collects all events and returns the final response.
 */

import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { isFinalResponse, stringifyContent } from '@google/adk';
import { getRunner, getSessionService } from '../agents/index.js';

const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  sessionId: z.string().optional(),
  userId: z.string().optional(),
});

const APP_NAME = 'my-multi-agent-app';

export const chatRouter = Router();

chatRouter.post('/chat', async (req: Request, res: Response) => {
  const parsed = ChatRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Validation error',
      message: parsed.error.errors.map((e) => e.message).join(', '),
      statusCode: 400,
    });
    return;
  }

  const { message, sessionId: rawSessionId, userId: rawUserId } = parsed.data;
  const sessionId = rawSessionId ?? uuidv4();
  const userId = rawUserId ?? 'anonymous';

  try {
    const runner = getRunner();
    const sessionService = getSessionService();

    let session = await sessionService.getSession({ appName: APP_NAME, userId, sessionId });
    if (!session) {
      session = await sessionService.createSession({ appName: APP_NAME, userId, sessionId, state: {} });
    }

    const newMessage = {
      role: 'user' as const,
      parts: [{ text: message.trim() }],
    };

    const agentTrace: Array<{ agent: string; content: string; timestamp: number }> = [];
    let finalResponse = '';

    const eventStream = runner.runAsync({ userId, sessionId, newMessage });

    for await (const event of eventStream) {
      const author = event.author ?? 'unknown';
      const text = stringifyContent(event);

      if (text) {
        agentTrace.push({ agent: author, content: text, timestamp: Date.now() });
      }

      // Track final responses from each agent — for SequentialAgent, we want
      // the LAST final response (from reviewer), not the first (from planner).
      if (isFinalResponse(event) && text) {
        finalResponse = text;
        // Do NOT break — let all sequential agents finish
      }
    }

    if (!finalResponse && agentTrace.length > 0) {
      finalResponse = agentTrace[agentTrace.length - 1].content;
    }

    res.json({ response: finalResponse, sessionId, userId, agentTrace });
  } catch (error) {
    console.error('[Chat] Error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Internal server error', message: msg, statusCode: 500 });
  }
});
