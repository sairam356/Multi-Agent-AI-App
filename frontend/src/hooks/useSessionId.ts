import { useChatStore } from '../store/chatStore.ts';


/**
 * Returns the stable session ID from the Zustand store.
 * The session persists for the lifetime of the browser tab.
 */
export function useSessionId(): string {
  return useChatStore((s) => s.sessionId);
}
