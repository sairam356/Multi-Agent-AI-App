export type AgentName = 'planner' | 'executor' | 'reviewer' | 'system';

export type AgentStatus = 'idle' | 'thinking' | 'active' | 'done' | 'error';

export interface AgentEvent {
  type: 'agent_text' | 'agent_status' | 'done' | 'error';
  agent?: AgentName;
  content?: string;
  status?: AgentStatus;
  error?: string;
  sessionId?: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agentName?: AgentName;
  timestamp: number;
  isStreaming?: boolean;
}

export interface AgentStatusMap {
  planner: AgentStatus;
  executor: AgentStatus;
  reviewer: AgentStatus;
}
