import { useCallback, useRef } from 'react';
import { createAgentStream } from '../api/agentClient.ts';
import { useChatStore } from '../store/chatStore.ts';
import type { AgentName, AgentStatus } from '../types/agent.types.ts';
import type { StreamEvent } from '../api/agentClient.ts';

/**
 * Manages the EventSource lifecycle for SSE-based agent streaming.
 *
 * Usage:
 *   const { sendMessage, isStreaming } = useAgentStream('user-123');
 *   sendMessage('What is the capital of France?');
 */
export function useAgentStream(userId = 'anonymous') {
  const cleanupRef = useRef<(() => void) | null>(null);

  const {
    sessionId,
    isStreaming,
    addMessage,
    setAgentStatus,
    setStreaming,
    appendStreamingContent,
    finalizeStreamingMessage,
    resetAgentStatuses,
  } = useChatStore();

  const sendMessage = useCallback(
    (messageText: string) => {
      if (isStreaming) return;
      if (!messageText.trim()) return;

      // Close any existing stream
      cleanupRef.current?.();

      // Add user message
      addMessage({ role: 'user', content: messageText.trim() });

      // Reset agent statuses and set streaming state
      resetAgentStatuses();
      setStreaming(true);
      appendStreamingContent('');

      let lastAgentLabel: AgentName = 'planner';

      const handleEvent = (event: StreamEvent) => {
        switch (event.type) {
          case 'agent_status': {
            const agent = event.agent as AgentName | undefined;
            const status = event.status as AgentStatus | undefined;
            if (agent && status) {
              setAgentStatus(agent, status);
            }
            break;
          }

          case 'agent_text': {
            const agent = (event.agent ?? 'reviewer') as AgentName;
            lastAgentLabel = agent;
            if (event.content) {
              appendStreamingContent(event.content);
            }
            break;
          }

          case 'done': {
            finalizeStreamingMessage(lastAgentLabel);
            setStreaming(false);
            cleanupRef.current?.();
            cleanupRef.current = null;
            break;
          }

          case 'error': {
            console.error('[Stream] Error event:', event.error);
            addMessage({
              role: 'assistant',
              content: `Error: ${event.error ?? 'Unknown streaming error'}`,
              agentName: 'system',
            });
            setStreaming(false);
            cleanupRef.current?.();
            cleanupRef.current = null;
            break;
          }
        }
      };

      const handleConnectionError = (e: Event) => {
        console.error('[Stream] Connection error:', e);
        addMessage({
          role: 'assistant',
          content: 'Connection error. Please check the backend is running and try again.',
          agentName: 'system',
        });
        setStreaming(false);
        cleanupRef.current = null;
      };

      cleanupRef.current = createAgentStream(
        messageText.trim(),
        sessionId,
        userId,
        handleEvent,
        handleConnectionError
      );
    },
    [
      isStreaming,
      sessionId,
      userId,
      addMessage,
      setAgentStatus,
      setStreaming,
      appendStreamingContent,
      finalizeStreamingMessage,
      resetAgentStatuses,
    ]
  );

  const cancelStream = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    setStreaming(false);
  }, [setStreaming]);

  return { sendMessage, isStreaming, cancelStream };
}
