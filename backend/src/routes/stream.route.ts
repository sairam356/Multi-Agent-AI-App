/**
 * GET /api/stream — Server-Sent Events (SSE) endpoint.
 *
 * Must be GET (not POST) because the native browser EventSource API only supports GET.
 *
 * Query params:
 *   - message    (required) user's message text
 *   - sessionId  (optional) resume an existing session
 *   - userId     (optional) user identifier
 *
 * SSE event types:
 *   - agent_status  { agent, status }
 *   - agent_text    { agent, content }
 *   - done          { sessionId }
 *   - error         { error }
 */

import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { isFinalResponse, stringifyContent } from '@google/adk';
import { getRunner, getSessionService } from '../agents/index.js';

const APP_NAME = 'my-multi-agent-app';

export const streamRouter = Router();

streamRouter.get('/stream', async (req: Request, res: Response) => {
  const { message, sessionId: rawSessionId, userId: rawUserId } = req.query as Record<string, string | undefined>;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    res.status(400).json({ error: 'Missing required query param: message' });
    return;
  }

  const sessionId = rawSessionId || uuidv4();
  const userId = rawUserId || 'anonymous';

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (eventType: string, data: Record<string, unknown>) => {
    res.write(`event: ${eventType}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const runner = getRunner();
    const sessionService = getSessionService();

    // Ensure session exists
    let session = await sessionService.getSession({ appName: APP_NAME, userId, sessionId });
    if (!session) {
      session = await sessionService.createSession({ appName: APP_NAME, userId, sessionId, state: {} });
    }

    // Build ADK Content (Google GenAI format)
    const newMessage = {
      role: 'user' as const,
      parts: [{ text: message.trim() }],
    };

    // Track current agent for status events
    const agentOrder = ['planner', 'executor', 'reviewer'] as const;
    let currentAgent = 'planner';

    sendEvent('agent_status', { agent: 'planner', status: 'active', timestamp: Date.now() });

    // Run the agent pipeline
    const eventStream = runner.runAsync({ userId, sessionId, newMessage });

    for await (const event of eventStream) {
      const author = event.author ?? '';

      // Map agent name to simplified label
      let agentLabel = currentAgent;
      if (author.includes('planner')) agentLabel = 'planner';
      else if (author.includes('executor')) agentLabel = 'executor';
      else if (author.includes('reviewer')) agentLabel = 'reviewer';

      // Emit status change when agent switches
      if (agentLabel !== currentAgent) {
        sendEvent('agent_status', { agent: currentAgent, status: 'done', timestamp: Date.now() });
        currentAgent = agentLabel;
        sendEvent('agent_status', { agent: currentAgent, status: 'active', timestamp: Date.now() });
      }

      // Extract text from the event
      const text = stringifyContent(event);

      if (text) {
        sendEvent('agent_text', { agent: agentLabel, content: text, timestamp: Date.now() });
      }

      // For SequentialAgent: isFinalResponse fires after EACH subagent.
      // We mark that subagent done but do NOT break — let all agents complete.
      if (isFinalResponse(event)) {
        sendEvent('agent_status', { agent: agentLabel, status: 'done', timestamp: Date.now() });
        currentAgent = agentLabel; // keep tracking
      }
    }

    sendEvent('done', { sessionId, timestamp: Date.now() });
  } catch (error) {
    console.error('[SSE] Stream error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    sendEvent('error', { error: msg, timestamp: Date.now() });
  } finally {
    res.end();
  }
});
