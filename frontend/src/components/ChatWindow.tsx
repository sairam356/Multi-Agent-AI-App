import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { useChatStore } from '../store/chatStore.ts';
import { useAgentStream } from '../hooks/useAgentStream.ts';
import { MessageBubble } from './MessageBubble.tsx';
import { AgentStatusBar } from './AgentStatusBar.tsx';

const PULSE_KEYFRAMES = `
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
`;

export function ChatWindow() {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, isStreaming, currentStreamingMessage, clearMessages } = useChatStore();
  const { sendMessage, cancelStream } = useAgentStream('user-1');

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamingMessage]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;

    sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#030712',
        color: '#f9fafb',
      }}
    >
      {/* Inject animation CSS */}
      <style>{PULSE_KEYFRAMES}</style>

      {/* Header */}
      <header
        style={{
          padding: '16px 24px',
          backgroundColor: '#111827',
          borderBottom: '1px solid #1f2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#f9fafb' }}>
            Multi-Agent AI
          </h1>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
            Planner → Executor → Reviewer pipeline · Azure OpenAI + Google ADK
          </p>
        </div>
        <button
          onClick={clearMessages}
          style={{
            padding: '6px 14px',
            backgroundColor: 'transparent',
            border: '1px solid #374151',
            borderRadius: '6px',
            color: '#9ca3af',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Clear
        </button>
      </header>

      {/* Agent status bar */}
      <AgentStatusBar />

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 0',
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: '#4b5563',
              marginTop: '80px',
              padding: '0 24px',
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px', color: '#9ca3af' }}>
              Multi-Agent AI Assistant
            </h2>
            <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
              Ask anything. Your request will be planned, executed, and reviewed by three specialized AI agents.
            </p>
            <div
              style={{
                marginTop: '24px',
                display: 'flex',
                gap: '8px',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              {[
                'What is 123 × 456?',
                'Explain quantum computing simply',
                'What are 3 tips for productivity?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  style={{
                    padding: '8px 14px',
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '20px',
                    color: '#d1d5db',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming message (in progress) */}
        {isStreaming && currentStreamingMessage && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              marginBottom: '16px',
              padding: '0 16px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
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
              R
            </div>
            <div style={{ maxWidth: '75%' }}>
              <div
                style={{
                  fontSize: '11px',
                  color: '#10b981',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '4px',
                  fontWeight: 600,
                }}
              >
                Streaming
              </div>
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '18px 18px 18px 4px',
                  backgroundColor: '#1f2937',
                  color: '#f9fafb',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  border: '1px solid #374151',
                }}
              >
                {currentStreamingMessage}
                <span
                  style={{
                    display: 'inline-block',
                    width: '2px',
                    height: '14px',
                    backgroundColor: '#10b981',
                    marginLeft: '2px',
                    verticalAlign: 'middle',
                    animation: 'blink 1s step-end infinite',
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator (streaming but no text yet) */}
        {isStreaming && !currentStreamingMessage && (
          <div style={{ display: 'flex', padding: '0 16px 16px', gap: '4px', alignItems: 'center' }}>
            <div style={{ width: '32px', marginRight: '8px' }} />
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#6b7280',
                  animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#111827',
          borderTop: '1px solid #1f2937',
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the multi-agent pipeline anything... (Enter to send, Shift+Enter for newline)"
            disabled={isStreaming}
            rows={1}
            style={{
              flex: 1,
              padding: '12px 16px',
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '12px',
              color: '#f9fafb',
              fontSize: '14px',
              resize: 'none',
              outline: 'none',
              lineHeight: '1.5',
              maxHeight: '120px',
              overflow: 'auto',
              fontFamily: 'inherit',
              opacity: isStreaming ? 0.6 : 1,
            }}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={cancelStream}
              style={{
                padding: '12px 20px',
                backgroundColor: '#ef4444',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputValue.trim()}
              style={{
                padding: '12px 20px',
                backgroundColor: inputValue.trim() ? '#3b82f6' : '#1f2937',
                border: 'none',
                borderRadius: '12px',
                color: inputValue.trim() ? 'white' : '#4b5563',
                fontSize: '14px',
                fontWeight: 600,
                cursor: inputValue.trim() ? 'pointer' : 'default',
                flexShrink: 0,
                transition: 'background-color 0.2s',
              }}
            >
              Send
            </button>
          )}
        </form>
        <p style={{ fontSize: '11px', color: '#4b5563', marginTop: '8px', textAlign: 'center' }}>
          Powered by Google ADK TypeScript + Azure OpenAI · Session persists until page refresh
        </p>
      </div>
    </div>
  );
}
