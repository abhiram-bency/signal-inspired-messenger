import React, { useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { fetchApiWithCredentials } from '../../lib/api';
import { ConversationListItem } from '../../types/chat';
import { Search, User, MessageCircle, Users, Edit, MoreHorizontal } from 'lucide-react';

interface SidebarProps {
  onOpenContacts?: () => void;
}

export function Sidebar({ onOpenContacts }: SidebarProps) {
  const { conversations, setConversations, activeConversationId, setActiveConversationId } = useChatStore();
  const { user } = useAuthStore();
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
    <div className="w-full border-r border-border flex flex-col bg-surface-1 h-full shrink-0">
      {/* Header */}
      <div className="h-[52px] flex items-center px-4 shrink-0 justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenContacts}
            className="h-8 w-8 rounded-full bg-surface-3 flex items-center justify-center overflow-hidden flex-shrink-0"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <User className="h-5 w-5 text-text-secondary" />
            )}
          </button>
          <h1 className="text-[15px] font-semibold text-text-primary tracking-tight truncate">{user?.display_name || 'Signal'}</h1>
        </div>
        <div className="flex items-center gap-1">
          {onOpenContacts && (
            <button 
              onClick={onOpenContacts}
              className="h-8 w-8 rounded-full hover:bg-surface-2 flex items-center justify-center text-text-secondary transition-colors"
              title="New Chat"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
          <button 
            className="h-8 w-8 rounded-full hover:bg-surface-2 flex items-center justify-center text-text-secondary transition-colors"
            title="More"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2 pt-1 shrink-0 bg-surface-1">
        <div className="relative">
          <Search className="absolute left-3 top-[6px] h-3.5 w-3.5 text-text-muted" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search" 
            className="w-full bg-surface-2 rounded-full py-[5px] pl-8 pr-3 text-[13px] text-text-primary placeholder:text-text-muted focus:outline-none focus:bg-surface-1 focus:ring-1 focus:ring-signal-blue border border-transparent focus:border-signal-blue transition-colors"
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
                className={`w-full flex items-center px-4 py-2 transition-colors text-left group ${isActive ? 'bg-surface-2 text-text-primary' : 'hover:bg-surface-2/50'}`}
              >
                {/* Avatar */}
                <div className="relative shrink-0 mr-[12px]">
                  <div className="h-12 w-12 rounded-full bg-surface-2 flex items-center justify-center overflow-hidden">
                    {conv.avatar_url ? (
                      <img src={conv.avatar_url} alt={conv.name || 'Chat'} className="h-full w-full object-cover" />
                    ) : conv.type === 'group' ? (
                      <Users className="h-[22px] w-[22px] text-text-secondary" />
                    ) : (
                      <User className="h-[22px] w-[22px] text-text-secondary" />
                    )}
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-baseline mb-[2px]">
                    <h3 className={`text-[14px] truncate ${conv.unread_count && conv.unread_count > 0 ? 'text-text-primary font-semibold' : 'text-text-primary font-medium'}`}>{conv.name || 'Unknown'}</h3>
                    {conv.last_message && (
                      <span className={`text-[11px] shrink-0 ml-2 leading-none ${conv.unread_count && conv.unread_count > 0 ? 'text-text-primary font-bold' : 'text-text-muted'}`}>
                        {new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className={`text-[13px] truncate leading-tight ${conv.unread_count && conv.unread_count > 0 ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                      {conv.last_message ? conv.last_message.content : 'No messages yet'}
                    </div>
                    {conv.unread_count && conv.unread_count > 0 ? (
                      <div className="ml-2 bg-signal-blue text-white text-[11px] font-bold h-[18px] min-w-[18px] rounded-full flex items-center justify-center px-1.5 shrink-0">
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
