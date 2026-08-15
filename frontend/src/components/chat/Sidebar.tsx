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
  const [searchQuery, setSearchQuery] = React.useState('');

  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await fetchApiWithCredentials<{ data: ConversationListItem[] }>('/conversations');
        // Sort conversations by updated_at descending
        const sorted = response.data.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        setConversations(sorted);
      } catch (err) {
        console.error('Failed to load conversations', err);
      }
    }
    loadConversations();
  }, [setConversations]);

  const filteredConversations = React.useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const lowerQ = searchQuery.toLowerCase();
    return conversations.filter(c => 
      c.name?.toLowerCase().includes(lowerQ) || 
      (c.last_message && c.last_message.content.toLowerCase().includes(lowerQ))
    );
  }, [conversations, searchQuery]);

  return (
    <div className="w-full border-r border-border flex flex-col bg-surface-1 h-full">
      {/* Header */}
      <div className="h-16 border-b border-border flex items-center px-4 shrink-0 justify-between">
        <h1 className="text-xl font-semibold text-text-primary tracking-tight">Chats</h1>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-border shrink-0 bg-surface-1">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search" 
            className="w-full bg-bg-primary rounded-full py-2 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-signal-blue border border-border-subtle"
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-full">
            <MessageCircle className="h-12 w-12 mb-4 text-text-muted opacity-50" />
            <h3 className="text-text-primary font-medium mb-1">No conversations yet</h3>
            <p className="text-text-secondary text-sm mb-6">Start chatting with your contacts</p>
            {onOpenContacts && (
              <button 
                onClick={onOpenContacts}
                className="px-4 py-2 bg-signal-blue hover:bg-signal-blue-dark text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Find someone to message
              </button>
            )}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isActive = conv.id === activeConversationId;
            return (
              <button
                key={conv.id}
                onClick={() => setActiveConversationId(conv.id)}
                className={`w-full flex items-center px-4 py-3 hover:bg-surface-2 transition-colors text-left border-l-2 ${isActive ? 'bg-surface-2 border-signal-blue' : 'border-transparent'}`}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="h-12 w-12 rounded-full bg-bg-elevated flex items-center justify-center overflow-hidden border border-border-subtle">
                    {conv.avatar_url ? (
                      <img src={conv.avatar_url} alt={conv.name || 'Chat'} className="h-full w-full rounded-full object-cover" />
                    ) : conv.type === 'group' ? (
                      <Users className="h-6 w-6 text-text-secondary" />
                    ) : (
                      <User className="h-6 w-6 text-text-secondary" />
                    )}
                  </div>
                  {/* Mock Online status for direct chats */}
                  {conv.type === 'direct' && (
                    <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-success border-2 border-surface-1"></div>
                  )}
                </div>
                
                {/* Content */}
                <div className="ml-3 flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline">
                    <h3 className={`font-medium truncate ${conv.unread_count && conv.unread_count > 0 ? 'text-text-primary font-semibold' : 'text-text-primary'}`}>{conv.name || 'Unknown'}</h3>
                    {conv.last_message && (
                      <span className={`text-xs shrink-0 ml-2 ${conv.unread_count && conv.unread_count > 0 ? 'text-signal-blue font-medium' : 'text-text-muted'}`}>
                        {new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-0.5">
                    <div className={`text-sm truncate ${conv.unread_count && conv.unread_count > 0 ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                      {conv.last_message ? conv.last_message.content : 'No messages yet'}
                    </div>
                    {conv.unread_count && conv.unread_count > 0 ? (
                      <div className="ml-2 bg-signal-blue text-white text-[11px] font-bold h-5 min-w-[20px] rounded-full flex items-center justify-center px-1.5 shrink-0 shadow-sm">
                        {conv.unread_count}
                      </div>
                    ) : null}
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
