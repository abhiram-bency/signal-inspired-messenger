import React, { useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { fetchApiWithCredentials } from '../../lib/api';
import { ConversationListItem } from '../../types/chat';
import { Search, User, MessageCircle, Users } from 'lucide-react';

interface SidebarProps {
  onOpenContacts?: () => void;
}

export function Sidebar({ onOpenContacts }: SidebarProps) {
  const { conversations, setConversations, activeConversationId, setActiveConversationId } = useChatStore();

  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await fetchApiWithCredentials<{ data: ConversationListItem[] }>('/conversations');
        setConversations(response.data);
      } catch (err) {
        console.error('Failed to load conversations', err);
      }
    }
    loadConversations();
  }, [setConversations]);

  return (
    <div className="w-80 border-r border-gray-200 flex flex-col bg-white h-full">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 flex items-center px-4 shrink-0 justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Chats</h1>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search chats" 
            className="w-full bg-gray-100 rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-full">
            <MessageCircle className="h-12 w-12 mb-4 text-gray-300" />
            <h3 className="text-gray-900 font-medium mb-1">No conversations yet</h3>
            <p className="text-gray-500 text-sm mb-6">Start chatting with your contacts</p>
            {onOpenContacts && (
              <button 
                onClick={onOpenContacts}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Find someone to message
              </button>
            )}
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <button
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={`w-full flex items-center px-4 py-3 hover:bg-gray-50 transition-colors text-left ${isActive ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
              >
                {/* Avatar */}
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  {conv.avatar_url ? (
                    <img src={conv.avatar_url} alt={conv.name || 'Chat'} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-blue-600" />
                  )}
                </div>
                
                {/* Content */}
                <div className="ml-3 flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-medium text-gray-900 truncate">{conv.name || 'Unknown'}</h3>
                    {conv.last_message && (
                      <span className="text-xs text-gray-500 shrink-0 ml-2">
                        {new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 truncate mt-0.5">
                    {conv.last_message ? conv.last_message.content : 'No messages yet'}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  );
}
