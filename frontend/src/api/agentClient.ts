/**
 * API client for communicating with the backend.
 * Handles both SSE streaming and regular REST calls.
 */

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export interface StreamEvent {
  type: 'agent_text' | 'agent_status' | 'done' | 'error';
  agent?: string;
  content?: string;
  status?: string;
  error?: string;
  sessionId?: string;
  timestamp: number;
}

export type StreamEventHandler = (event: StreamEvent) => void;

/**
 * Creates an EventSource connection for SSE streaming.
 * Returns a cleanup function to close the connection.
 */
export function createAgentStream(
  message: string,
  sessionId: string,
  userId: string,
  onEvent: StreamEventHandler,
  onError?: (error: Event) => void
): () => void {
  const params = new URLSearchParams({
    message,
    sessionId,
    userId,
  });

  const url = `${API_URL}/api/stream?${params.toString()}`;
  const eventSource = new EventSource(url);

  const handleEvent = (eventType: StreamEvent['type']) => (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data) as StreamEvent;
      onEvent({ ...data, type: eventType });
    } catch {
      console.error(`[AgentClient] Failed to parse ${eventType} event:`, e.data);
    }
  };

  eventSource.addEventListener('agent_text', handleEvent('agent_text'));
  eventSource.addEventListener('agent_status', handleEvent('agent_status'));
  eventSource.addEventListener('done', handleEvent('done'));
  eventSource.addEventListener('error', (e: Event) => {
    if (e instanceof MessageEvent) {
      handleEvent('error')(e);
    } else {
      onError?.(e);
    }
  });

  return () => eventSource.close();
}

/**
 * Sends a message via the non-streaming REST API.
 */
export async function sendChatMessage(
  message: string,
  sessionId?: string,
  userId?: string
): Promise<{ response: string; sessionId: string }> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId, userId }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(err.message ?? `HTTP ${response.status}`);
  }

  return response.json() as Promise<{ response: string; sessionId: string }>;
}
