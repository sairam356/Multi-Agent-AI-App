/** Request body for POST /api/chat */
export interface ChatRequest {
  message: string;
  sessionId?: string;
  userId?: string;
}

/** Response from POST /api/chat */
export interface ChatResponse {
  response: string;
  sessionId: string;
  userId: string;
  agentTrace?: AgentTraceEntry[];
}

export interface AgentTraceEntry {
  agent: string;
  content: string;
  timestamp: number;
}

/** Query params for GET /api/stream */
export interface StreamQueryParams {
  message: string;
  sessionId?: string;
  userId?: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}
