import React, { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { fetchApiWithCredentials } from '../../lib/api';
import { MessageResponse, ConversationDetail } from '../../types/chat';
import { Send, User, MoreVertical, ArrowLeft, Paperclip } from 'lucide-react';
import { wsClient } from '../../lib/websocket';
import { useTypingStore } from '../../stores/typingStore';

export function ChatWindow() {
  const { activeConversationId, setActiveConversationId, messagesByConversation, setMessages, addMessage, updateMessageStatus } = useChatStore();
  const { user } = useAuthStore();
  const [inputText, setInputText] = useState('');
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [contacts, setContacts] = useState<{ id: string, nickname: string | null, contact: { id: string, display_name: string, username: string | null, avatar_url: string | null } }[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { typingUsersByConversation } = useTypingStore();
  const typingUsers = activeConversationId ? (typingUsersByConversation[activeConversationId] || []) : [];

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isAdmin = detail?.members.some(m => m.id === user?.id && m.role === 'admin');

  // Load conversation details and messages
  useEffect(() => {
    if (!activeConversationId) return;

    let mounted = true;
    setLoading(true);

    async function loadData() {
      try {
        // Load messages history
        const msgRes = await fetchApiWithCredentials<{ data: MessageResponse[] }>(`/conversations/${activeConversationId}/messages`);
        if (mounted) {
          setMessages(activeConversationId!, msgRes.data);
        }

        // Optionally load conversation details for the header
        const detailRes = await fetchApiWithCredentials<{ data: ConversationDetail }>(`/conversations/${activeConversationId}`);
        if (mounted) {
          setDetail(detailRes.data);
        }
      } catch (err) {
        console.error('Failed to load chat data', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
      setDetail(null);
    };
  }, [activeConversationId, setMessages]);

  // Scroll to bottom when messages change
  const messages = React.useMemo(() => {
    return activeConversationId ? (messagesByConversation[activeConversationId] || []) : [];
  }, [activeConversationId, messagesByConversation]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when conversation is active and has unread messages
  useEffect(() => {
    if (!activeConversationId || !user) return;
    
    // Find unread messages from others
    const unreadMessages = messages.filter(
      msg => msg.sender.id !== user.id && msg.status !== 'read'
    );
    
    if (unreadMessages.length > 0) {
      unreadMessages.forEach(msg => {
        wsClient.send('receipt.update', {
          message_id: msg.id,
          conversation_id: activeConversationId,
          status: 'read'
        });
        
        // Optimistically update locally
        updateMessageStatus(activeConversationId, msg.id, {
          ...msg,
          status: 'read'
        });
      });
    }
  }, [messages, activeConversationId, user, updateMessageStatus]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversationId || !user) return;

    const content = inputText.trim();
    setInputText('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    wsClient.send('typing.stop', { conversation_id: activeConversationId });

    const clientMsgId = crypto.randomUUID();

    // Optimistic UI update
    const optimisticMsg: MessageResponse = {
      id: `temp-${clientMsgId}`,
      conversation_id: activeConversationId,
      sender: {
        id: user.id,
        display_name: user.display_name,
        avatar_url: null,
      },
      content,
      message_type: 'text',
      reply_to: null,
      created_at: new Date().toISOString(),
      edited_at: null,
      deleted_at: null,
      status: 'sending',
      client_message_id: clientMsgId
    };

    addMessage(activeConversationId, optimisticMsg);

    // Send via WebSocket
    wsClient.send('message.send', {
      client_message_id: clientMsgId,
      conversation_id: activeConversationId,
      content,
      message_type: 'text',
      reply_to_id: null
    });
  };

  const handleRemoveMember = async (userId: string) => {
    if (!activeConversationId) return;
    setActionLoading(`remove-${userId}`);
    try {
      const res = await fetchApiWithCredentials<{ data: ConversationDetail }>(`/conversations/${activeConversationId}/members/${userId}`, {
        method: 'DELETE'
      });
      setDetail(res.data);
    } catch (err) {
      console.error('Failed to remove member', err);
      alert('Failed to remove member');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!activeConversationId) return;
    setActionLoading(`add-${userId}`);
    try {
      const res = await fetchApiWithCredentials<{ data: ConversationDetail }>(`/conversations/${activeConversationId}/members`, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId })
      });
      setDetail(res.data);
      setAddingMember(false);
    } catch (err) {
      console.error('Failed to add member', err);
      alert('Failed to add member');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    if (addingMember && contacts.length === 0) {
      fetchApiWithCredentials<{ data: { id: string, nickname: string | null, contact: { id: string, display_name: string, username: string | null, avatar_url: string | null } }[] }>('/contacts')
        .then(res => setContacts(res.data))
        .catch(console.error);
    }
  }, [addingMember, contacts.length]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    
    if (activeConversationId) {
      wsClient.send('typing.start', { conversation_id: activeConversationId });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        wsClient.send('typing.stop', { conversation_id: activeConversationId });
      }, 3000);
    }
  };

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-bg-primary h-full">
        <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mb-4">
          <Send className="h-8 w-8 text-signal-blue ml-1" />
        </div>
        <h2 className="text-xl font-medium text-text-primary">Signal-Inspired Messenger</h2>
        <p className="text-text-muted mt-2">Select a conversation to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-bg-primary h-full relative">
      {/* Header */}
      <div className="h-16 border-b border-border bg-surface-1 flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center">
          <button
            onClick={() => setActiveConversationId(null)}
            className="mr-3 p-2 -ml-2 rounded-full hover:bg-surface-2 md:hidden text-text-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="h-10 w-10 rounded-full bg-surface-2 flex items-center justify-center border border-border-subtle overflow-hidden">
             {detail?.avatar_url ? (
               <img src={detail.avatar_url} alt="Avatar" className="h-full w-full rounded-full object-cover" />
             ) : (
               <User className="h-5 w-5 text-text-secondary" />
             )}
          </div>
          <div className="ml-3">
            <h2 className="font-medium text-text-primary">{detail?.name || 'Loading...'}</h2>
            <p className="text-xs text-text-muted">
              {detail?.type === 'direct' ? 'Direct Message' : `${detail?.members?.length || 0} members`}
            </p>
          </div>
        </div>
        <button 
          onClick={() => {
            if (detail?.type === 'group') setShowMembers(true);
          }}
          className={`p-2 rounded-full transition-colors ${detail?.type === 'group' ? 'hover:bg-surface-2 text-text-secondary' : 'opacity-0 cursor-default'}`}
          title="View Members"
          disabled={detail?.type !== 'group'}
        >
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse bg-bg-primary">
        <div ref={messagesEndRef} />
        {messages.map((msg, idx) => {
          const isMine = msg.sender.id === user?.id;
          
          // Determine grouping to apply dynamic border radii
          const prevMsg = idx < messages.length - 1 ? messages[idx + 1] : null; // Older message
          const nextMsg = idx > 0 ? messages[idx - 1] : null; // Newer message
          
          const isFirstInGroup = !prevMsg || prevMsg.sender.id !== msg.sender.id;
          const isLastInGroup = !nextMsg || nextMsg.sender.id !== msg.sender.id;
          
          const showAvatar = !isMine && isLastInGroup;
          
          // Signal-style radii
          let borderRadiusClass = 'rounded-2xl';
          if (isMine) {
            if (isFirstInGroup && isLastInGroup) borderRadiusClass = 'rounded-2xl rounded-br-[4px]';
            else if (isFirstInGroup) borderRadiusClass = 'rounded-2xl rounded-br-[4px]';
            else if (isLastInGroup) borderRadiusClass = 'rounded-2xl rounded-tr-[4px] rounded-br-[4px]';
            else borderRadiusClass = 'rounded-2xl rounded-r-[4px]';
          } else {
            if (isFirstInGroup && isLastInGroup) borderRadiusClass = 'rounded-2xl rounded-bl-[4px]';
            else if (isFirstInGroup) borderRadiusClass = 'rounded-2xl rounded-bl-[4px]';
            else if (isLastInGroup) borderRadiusClass = 'rounded-2xl rounded-tl-[4px] rounded-bl-[4px]';
            else borderRadiusClass = 'rounded-2xl rounded-l-[4px]';
          }
          
          return (
            <div key={msg.id} className={`flex w-full ${isLastInGroup ? 'mb-4' : 'mb-[2px]'} ${isMine ? 'justify-end' : 'justify-start'}`}>
              {!isMine && (
                <div className="w-8 shrink-0 mr-2 flex flex-col justify-end">
                  {showAvatar && (
                    <div className="h-8 w-8 rounded-full bg-surface-2 flex items-center justify-center border border-border-subtle overflow-hidden">
                      <User className="h-4 w-4 text-text-secondary" />
                    </div>
                  )}
                </div>
              )}
              
              <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col relative group`}>
                {isFirstInGroup && !isMine && detail?.type === 'group' && (
                  <span className="text-[12px] font-medium text-text-secondary ml-1 mb-1">{msg.sender.display_name}</span>
                )}
                <div 
                  className={`px-3.5 py-2 shadow-sm text-[15px] leading-[1.3] text-text-primary ${borderRadiusClass}
                    ${isMine ? 'bg-bubble-outgoing' : 'bg-bubble-incoming border border-border-subtle'}`}
                >
                  <span className="break-words">{msg.content}</span>
                  
                  {/* Inline Timestamp & Receipts (Signal style, bottom right of bubble) */}
                  <span className={`inline-flex items-center ml-3 text-[11px] float-right mt-1.5 leading-none
                    ${isMine ? 'text-[rgba(255,255,255,0.7)]' : 'text-text-muted'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMine && (
                      <span className={`ml-1 flex items-center justify-center ${msg.status === 'read' ? 'text-signal-teal' : ''}`}>
                        {msg.status === 'sending' ? '⋯' : msg.status === 'sent' ? '✓' : '✓✓'}
                      </span>
                    )}
                  </span>
                  <div className="clear-both"></div>
                </div>
              </div>
            </div>
          );
        })}
        {loading && <div className="text-center text-sm text-text-muted py-4">Loading messages...</div>}
        
        {typingUsers.length > 0 && (
          <div className="flex w-full mb-3 justify-start items-end">
            <div className="w-8 shrink-0 mr-2 flex flex-col justify-end">
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-4 w-4 text-gray-500" />
              </div>
            </div>
            <div className="flex flex-col items-start">
              <div className="px-4 py-2 rounded-2xl rounded-bl-[4px] shadow-sm text-[15px] bg-bubble-incoming text-text-primary border border-border-subtle flex items-center space-x-1 h-[38px]">
                <span className="animate-bounce inline-block w-1.5 h-1.5 bg-text-muted rounded-full" style={{ animationDelay: '0ms' }}></span>
                <span className="animate-bounce inline-block w-1.5 h-1.5 bg-text-muted rounded-full" style={{ animationDelay: '150ms' }}></span>
                <span className="animate-bounce inline-block w-1.5 h-1.5 bg-text-muted rounded-full" style={{ animationDelay: '300ms' }}></span>
              </div>
              <div className="text-[11px] text-text-muted mt-1 pl-1">
                {typingUsers.length === 1 
                  ? `${typingUsers[0].displayName} is typing...` 
                  : `${typingUsers.length} people are typing...`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 bg-surface-1 border-t border-border shrink-0">
        <form onSubmit={handleSend} className="flex items-end space-x-3 max-w-4xl mx-auto w-full">
          <button 
            type="button" 
            className="p-2.5 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors shrink-0 mb-[2px]"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <div className="flex-1 bg-surface-2 rounded-2xl flex items-end min-h-[44px] overflow-hidden border border-border-subtle focus-within:border-signal-blue focus-within:ring-1 focus-within:ring-signal-blue transition-all">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder="Signal message"
              className="w-full bg-transparent border-none focus:ring-0 py-3 px-4 outline-none text-text-primary placeholder:text-text-muted"
            />
          </div>
          <button 
            type="submit" 
            disabled={!inputText.trim()}
            className="h-[44px] w-[44px] rounded-full bg-signal-blue hover:bg-signal-blue-dark disabled:bg-surface-2 disabled:text-text-muted flex items-center justify-center text-white shrink-0 transition-colors mb-0"
          >
            <Send className="h-5 w-5 ml-0.5" />
          </button>
        </form>
      </div>

      {/* Group Members Modal */}
      {showMembers && detail?.type === 'group' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-1 rounded-2xl shadow-xl border border-border w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-surface-2 shrink-0">
              <h2 className="text-lg font-semibold text-text-primary">{addingMember ? 'Add Member' : 'Group Members'}</h2>
              <div className="flex items-center gap-2">
                {!addingMember && isAdmin && (
                  <button 
                    onClick={() => setAddingMember(true)}
                    className="text-sm text-signal-blue hover:text-signal-blue-dark font-medium px-2 py-1 rounded-lg hover:bg-surface-3 transition-colors"
                  >
                    Add
                  </button>
                )}
                {addingMember && (
                  <button 
                    onClick={() => setAddingMember(false)}
                    className="text-sm text-text-secondary hover:text-text-primary font-medium px-2 py-1 rounded-lg hover:bg-surface-3 transition-colors"
                  >
                    Back
                  </button>
                )}
                <button 
                  onClick={() => {
                    setShowMembers(false);
                    setAddingMember(false);
                  }}
                  className="p-2 -mr-2 text-text-muted hover:text-text-primary hover:bg-surface-3 rounded-full transition-colors"
                >
                  <span className="sr-only">Close</span>
                  <span className="text-xl leading-none flex items-center justify-center w-5 h-5">&times;</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {addingMember ? (
                contacts.length === 0 ? (
                  <div className="text-center p-4 text-text-muted text-sm">No contacts available to add.</div>
                ) : (
                  contacts.map((c) => {
                    const isAlreadyMember = detail.members.some(m => m.id === c.contact.id);
                    return (
                      <div key={c.id} className="flex items-center justify-between p-3 hover:bg-surface-2 rounded-xl transition-colors border border-border-subtle">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center overflow-hidden">
                            {c.contact.avatar_url ? (
                              <img src={c.contact.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <User className="h-5 w-5 text-text-secondary" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-text-primary">{c.nickname || c.contact.display_name}</div>
                          </div>
                        </div>
                        {isAlreadyMember ? (
                          <span className="text-xs text-text-muted font-medium px-2">Member</span>
                        ) : (
                          <button
                            onClick={() => handleAddMember(c.contact.id)}
                            disabled={actionLoading === `add-${c.contact.id}`}
                            className="text-xs bg-signal-blue text-white hover:bg-signal-blue-dark font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {actionLoading === `add-${c.contact.id}` ? 'Adding...' : 'Add'}
                          </button>
                        )}
                      </div>
                    );
                  })
                )
              ) : (
                detail.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 hover:bg-surface-2 rounded-xl transition-colors border border-border-subtle">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center overflow-hidden">
                        <User className="h-5 w-5 text-text-secondary" />
                      </div>
                      <div>
                        <div className="font-medium text-text-primary">
                          {member.display_name}
                          {member.id === user?.id && <span className="text-text-muted ml-1 font-normal">(You)</span>}
                        </div>
                        <div className="text-xs text-text-muted capitalize">{member.role}</div>
                      </div>
                    </div>
                    {isAdmin && member.id !== user?.id && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={actionLoading === `remove-${member.id}`}
                        className="text-xs text-error hover:bg-error/10 font-medium px-2 py-1 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {actionLoading === `remove-${member.id}` ? 'Removing...' : 'Remove'}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
