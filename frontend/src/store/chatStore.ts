import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, AgentStatusMap, AgentName, AgentStatus } from '../types/agent.types.ts';

interface ChatStore {
  // State
  messages: ChatMessage[];
  agentStatuses: AgentStatusMap;
  isStreaming: boolean;
  currentStreamingMessage: string;
  sessionId: string;

  // Actions
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateLastAssistantMessage: (content: string) => void;
  setAgentStatus: (agent: AgentName, status: AgentStatus) => void;
  setStreaming: (streaming: boolean) => void;
  appendStreamingContent: (text: string) => void;
  finalizeStreamingMessage: (agentName?: AgentName) => void;
  resetAgentStatuses: () => void;
  clearMessages: () => void;
}

const defaultAgentStatuses: AgentStatusMap = {
  planner: 'idle',
  executor: 'idle',
  reviewer: 'idle',
};

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  agentStatuses: { ...defaultAgentStatuses },
  isStreaming: false,
  currentStreamingMessage: '',
  sessionId: uuidv4(),

  addMessage: (msg) => {
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...msg,
          id: uuidv4(),
          timestamp: Date.now(),
        },
      ],
    }));
  },

  updateLastAssistantMessage: (content) => {
    set((state) => {
      const messages = [...state.messages];
      // Find last assistant message
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant') {
          messages[i] = { ...messages[i], content };
          return { messages };
        }
      }
      return {};
    });
  },

  setAgentStatus: (agent, status) => {
    set((state) => ({
      agentStatuses: { ...state.agentStatuses, [agent]: status },
    }));
  },

  setStreaming: (streaming) => {
    set({ isStreaming: streaming });
    if (!streaming) {
      set({ currentStreamingMessage: '' });
    }
  },

  appendStreamingContent: (text) => {
    set({ currentStreamingMessage: text });
  },

  finalizeStreamingMessage: (agentName) => {
    const { currentStreamingMessage } = get();
    if (!currentStreamingMessage) return;

    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: uuidv4(),
          role: 'assistant',
          content: currentStreamingMessage,
          agentName: agentName ?? 'reviewer',
          timestamp: Date.now(),
          isStreaming: false,
        },
      ],
      currentStreamingMessage: '',
      isStreaming: false,
    }));
  },

  resetAgentStatuses: () => {
    set({ agentStatuses: { ...defaultAgentStatuses } });
  },

  clearMessages: () => {
    set({
      messages: [],
      currentStreamingMessage: '',
      isStreaming: false,
      agentStatuses: { ...defaultAgentStatuses },
    });
  },
}));
