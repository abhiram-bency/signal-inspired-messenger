import { create } from 'zustand';
import { ConversationListItem, MessageResponse } from '../types/chat';

interface ChatState {
  conversations: ConversationListItem[];
  activeConversationId: string | null;
  messagesByConversation: Record<string, MessageResponse[]>;
  connectionReady: boolean;
  
  setConversations: (conversations: ConversationListItem[]) => void;
  addConversation: (conversation: ConversationListItem) => void;
  setActiveConversationId: (id: string | null) => void;
  setMessages: (conversationId: string, messages: MessageResponse[]) => void;
  addMessage: (conversationId: string, message: MessageResponse) => void;
  updateMessageStatus: (conversationId: string, clientMessageId: string, serverMessage: MessageResponse) => void;
  setConnectionReady: (ready: boolean) => void;
  logout: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messagesByConversation: {},
  connectionReady: false,
  
  setConversations: (conversations) => set({ conversations }),
  
  addConversation: (conversation) => set((state) => {
    // Avoid duplicates
    if (state.conversations.some(c => c.id === conversation.id)) return state;
    return { conversations: [conversation, ...state.conversations] };
  }),
  
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  
  setMessages: (conversationId, messages) => set((state) => ({
    messagesByConversation: {
      ...state.messagesByConversation,
      [conversationId]: messages
    }
  })),
  
  addMessage: (conversationId, message) => set((state) => {
    const existing = state.messagesByConversation[conversationId] || [];
    
    // Prevent duplicates (checking by server ID or client ID)
    if (existing.some(m => m.id === message.id || (message.client_message_id && m.client_message_id === message.client_message_id))) {
      return state;
    }
    
    return {
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [message, ...existing] // Assuming descending order (newest first)
      }
    };
  }),

  updateMessageStatus: (conversationId, clientMessageId, serverMessage) => set((state) => {
    const existing = state.messagesByConversation[conversationId] || [];
    const updated = existing.map(msg => 
      (msg.client_message_id === clientMessageId || msg.id === serverMessage.id) ? serverMessage : msg
    );
    
    return {
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: updated
      }
    };
  }),

  setConnectionReady: (ready) => set({ connectionReady: ready }),

  logout: () => set({
    conversations: [],
    activeConversationId: null,
    messagesByConversation: {},
    connectionReady: false
  })
}));

// Quick map to the correct backend schema naming
// Just keeping it clean for the component usage
export type { ConversationListItem as Conversation } from '../types/chat';
export type { MessageResponse as Message } from '../types/chat';
