import type { ChatMessage } from '../types/agent.types.ts';

interface MessageBubbleProps {
  message: ChatMessage;
}

const agentColors: Record<string, string> = {
  planner: '#8b5cf6',
  executor: '#3b82f6',
  reviewer: '#10b981',
  system: '#ef4444',
  assistant: '#10b981',
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const agentColor = message.agentName
    ? (agentColors[message.agentName] ?? '#6b7280')
    : agentColors.assistant;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '16px',
        padding: '0 16px',
      }}
    >
      {!isUser && (
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: agentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 700,
            color: 'white',
            marginRight: '8px',
            flexShrink: 0,
            alignSelf: 'flex-end',
          }}
        >
          {message.agentName ? message.agentName[0].toUpperCase() : 'A'}
        </div>
      )}
      <div style={{ maxWidth: '75%' }}>
        {!isUser && message.agentName && (
          <div
            style={{
              fontSize: '11px',
              color: agentColor,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '4px',
              fontWeight: 600,
            }}
          >
            {message.agentName}
          </div>
        )}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            backgroundColor: isUser ? '#3b82f6' : '#1f2937',
            color: '#f9fafb',
            fontSize: '14px',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            border: isUser ? 'none' : `1px solid #374151`,
          }}
        >
          {message.content}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: '#6b7280',
            marginTop: '4px',
            textAlign: isUser ? 'right' : 'left',
          }}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
