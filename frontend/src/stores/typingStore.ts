import { create } from 'zustand';

interface TypingUser {
  userId: string;
  displayName: string;
  timestamp: number;
}

interface TypingState {
  typingUsersByConversation: Record<string, TypingUser[]>;
  
  addTypingUser: (conversationId: string, userId: string, displayName: string) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
  clearStaleTypingUsers: () => void;
}

const TYPING_TIMEOUT = 5000;

export const useTypingStore = create<TypingState>((set) => ({
  typingUsersByConversation: {},
  
  addTypingUser: (conversationId, userId, displayName) => set((state) => {
    const existing = state.typingUsersByConversation[conversationId] || [];
    const filtered = existing.filter(u => u.userId !== userId);
    
    return {
      typingUsersByConversation: {
        ...state.typingUsersByConversation,
        [conversationId]: [...filtered, { userId, displayName, timestamp: Date.now() }]
      }
    };
  }),
  
  removeTypingUser: (conversationId, userId) => set((state) => {
    const existing = state.typingUsersByConversation[conversationId] || [];
    const filtered = existing.filter(u => u.userId !== userId);
    
    return {
      typingUsersByConversation: {
        ...state.typingUsersByConversation,
        [conversationId]: filtered
      }
    };
  }),

  clearStaleTypingUsers: () => set((state) => {
    const now = Date.now();
    const updated: Record<string, TypingUser[]> = {};
    let hasChanges = false;
    
    for (const [convId, users] of Object.entries(state.typingUsersByConversation)) {
      const freshUsers = users.filter(u => now - u.timestamp < TYPING_TIMEOUT);
      updated[convId] = freshUsers;
      if (freshUsers.length !== users.length) {
        hasChanges = true;
      }
    }
    
    if (hasChanges) {
      return { typingUsersByConversation: updated };
    }
    return state;
  })
}));

// Set up interval to clear stale typing users automatically
if (typeof window !== 'undefined') {
  setInterval(() => {
    useTypingStore.getState().clearStaleTypingUsers();
  }, 1000);
}
