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
  updateMessageReceipt: (conversationId: string, messageId: string, status: MessageResponse['status']) => void;
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
  
  setActiveConversationId: (id) => set((state) => {
    const newConvs = state.conversations.map(c => 
      c.id === id ? { ...c, unread_count: 0 } : c
    );
    return { activeConversationId: id, conversations: newConvs };
  }),
  
  setMessages: (conversationId, messages) => set((state) => ({
    messagesByConversation: {
      ...state.messagesByConversation,
      [conversationId]: messages
    }
  })),
  
  addMessage: (conversationId, message) => set((state) => {
    const existing = state.messagesByConversation[conversationId] || [];
    
    // Prevent duplicates
    if (existing.some(m => m.id === message.id || (message.client_message_id && m.client_message_id === message.client_message_id))) {
      return state;
    }
    
    const newMessages = [message, ...existing];
    
    // Update conversation list: move to top, update last_message, update unread_count if not active
    const newConvs = [...state.conversations];
    const convIndex = newConvs.findIndex(c => c.id === conversationId);
    
    if (convIndex > -1) {
      const conv = { ...newConvs[convIndex] };
      conv.last_message = {
        id: message.id,
        content: message.content,
        sender_id: message.sender.id,
        created_at: message.created_at
      };
      conv.updated_at = message.created_at;
      
      if (state.activeConversationId !== conversationId && !message.client_message_id) {
        conv.unread_count = (conv.unread_count || 0) + 1;
      }
      
      newConvs.splice(convIndex, 1);
      newConvs.unshift(conv); // Move to top
    }

    return {
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: newMessages
      },
      conversations: newConvs
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

  updateMessageReceipt: (conversationId, messageId, status) => set((state) => {
    const existing = state.messagesByConversation[conversationId] || [];
    const updated = existing.map(msg => {
      if (msg.id === messageId) {
        // Upgrade status: sent -> delivered -> read
        const currentScore = msg.status === 'read' ? 3 : msg.status === 'delivered' ? 2 : 1;
        const newScore = status === 'read' ? 3 : status === 'delivered' ? 2 : 1;
        if (newScore > currentScore) {
          return { ...msg, status };
        }
      }
      return msg;
    });
    
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
