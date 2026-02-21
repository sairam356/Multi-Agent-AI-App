import { useChatStore } from '../store/chatStore.ts';
import type { AgentStatus } from '../types/agent.types.ts';

interface AgentBadgeProps {
  name: string;
  status: AgentStatus;
}

function AgentBadge({ name, status }: AgentBadgeProps) {
  const statusColors: Record<AgentStatus, string> = {
    idle: '#6b7280',
    thinking: '#f59e0b',
    active: '#3b82f6',
    done: '#10b981',
    error: '#ef4444',
  };

  const statusLabels: Record<AgentStatus, string> = {
    idle: 'Idle',
    thinking: 'Thinking...',
    active: 'Active',
    done: 'Done',
    error: 'Error',
  };

  const isAnimated = status === 'active' || status === 'thinking';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: '20px',
        backgroundColor: '#1f2937',
        border: `1px solid ${statusColors[status]}`,
        transition: 'border-color 0.3s ease',
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: statusColors[status],
          animation: isAnimated ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }}
      />
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#e5e7eb' }}>
        {name}
      </span>
      <span
        style={{
          fontSize: '11px',
          color: statusColors[status],
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {statusLabels[status]}
      </span>
    </div>
  );
}

export function AgentStatusBar() {
  const { agentStatuses, isStreaming } = useChatStore();

  if (
    !isStreaming &&
    agentStatuses.planner === 'idle' &&
    agentStatuses.executor === 'idle' &&
    agentStatuses.reviewer === 'idle'
  ) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        padding: '12px 16px',
        backgroundColor: '#111827',
        borderBottom: '1px solid #374151',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <span style={{ fontSize: '12px', color: '#9ca3af', marginRight: '4px' }}>
        Agents:
      </span>
      <AgentBadge name="Planner" status={agentStatuses.planner} />
      <span style={{ color: '#4b5563', fontSize: '16px' }}>→</span>
      <AgentBadge name="Executor" status={agentStatuses.executor} />
      <span style={{ color: '#4b5563', fontSize: '16px' }}>→</span>
      <AgentBadge name="Reviewer" status={agentStatuses.reviewer} />
    </div>
  );
}
