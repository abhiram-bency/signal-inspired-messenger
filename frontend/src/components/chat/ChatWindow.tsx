import React, { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { fetchApiWithCredentials } from '../../lib/api';
import { MessageResponse, ConversationDetail } from '../../types/chat';
import { Send, User, MoreVertical, ArrowLeft, Paperclip, Plus, Smile, Mic, Video, Phone, Search } from 'lucide-react';
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
      <div className="h-[52px] border-b border-border-subtle bg-bg-primary flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center">
          <button
            onClick={() => setActiveConversationId(null)}
            className="mr-2 p-1.5 -ml-1.5 rounded-full hover:bg-surface-2 md:hidden text-text-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="h-9 w-9 rounded-full bg-surface-3 flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => { if (detail?.type === 'group') setShowMembers(true); }}>
             {detail?.avatar_url ? (
               <img src={detail.avatar_url} alt="Avatar" className="h-full w-full rounded-full object-cover" />
             ) : (
               <User className="h-[18px] w-[18px] text-text-secondary" />
             )}
          </div>
          <div className="ml-3 cursor-pointer" onClick={() => { if (detail?.type === 'group') setShowMembers(true); }}>
            <h2 className="text-[15px] font-semibold text-text-primary leading-tight">{detail?.name || 'Loading...'}</h2>
            <p className="text-[12px] text-text-secondary leading-tight mt-0.5">
              {detail?.type === 'direct' ? 'Direct Message' : `${detail?.members?.length || 0} members`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            className="h-8 w-8 rounded-full flex items-center justify-center text-text-muted hover:bg-surface-2 hover:text-text-primary transition-colors cursor-not-allowed"
            title="Video calls are not available in this assignment."
          >
            <Video className="h-[18px] w-[18px]" />
          </button>
          <button 
            className="h-8 w-8 rounded-full flex items-center justify-center text-text-muted hover:bg-surface-2 hover:text-text-primary transition-colors cursor-not-allowed"
            title="Voice calls are not available in this assignment."
          >
            <Phone className="h-[18px] w-[18px]" />
          </button>
          <div className="w-[1px] h-4 bg-border-subtle mx-0.5"></div>
          <button 
            className="h-8 w-8 rounded-full flex items-center justify-center text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors"
            title="Search"
          >
            <Search className="h-[18px] w-[18px]" />
          </button>
          <button 
            onClick={() => {
              if (detail?.type === 'group') setShowMembers(true);
            }}
            className={`h-8 w-8 rounded-full flex items-center justify-center text-text-secondary transition-colors ${detail?.type === 'group' ? 'hover:bg-surface-2 hover:text-text-primary' : 'opacity-0 cursor-default'}`}
            title="View Members"
            disabled={detail?.type !== 'group'}
          >
            <MoreVertical className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:px-12 lg:px-24 flex flex-col-reverse custom-scrollbar bg-bg-primary">
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
          let borderRadiusClass = 'rounded-[18px]';
          if (isMine) {
            if (isFirstInGroup && isLastInGroup) borderRadiusClass = 'rounded-[18px]';
            else if (isFirstInGroup) borderRadiusClass = 'rounded-[18px] rounded-br-[4px]';
            else if (isLastInGroup) borderRadiusClass = 'rounded-[18px] rounded-tr-[4px]';
            else borderRadiusClass = 'rounded-[18px] rounded-r-[4px]';
          } else {
            if (isFirstInGroup && isLastInGroup) borderRadiusClass = 'rounded-[18px]';
            else if (isFirstInGroup) borderRadiusClass = 'rounded-[18px] rounded-bl-[4px]';
            else if (isLastInGroup) borderRadiusClass = 'rounded-[18px] rounded-tl-[4px]';
            else borderRadiusClass = 'rounded-[18px] rounded-l-[4px]';
          }
          
          return (
            <div key={msg.id} className={`flex w-full ${isFirstInGroup ? 'mb-4' : 'mb-[2px]'} ${isMine ? 'justify-end' : 'justify-start'}`}>
              {!isMine && (
                <div className="w-8 shrink-0 mr-2 flex flex-col justify-end">
                  {showAvatar && (
                    <div className="h-7 w-7 rounded-full bg-surface-3 flex items-center justify-center overflow-hidden mb-0.5">
                      <User className="h-3.5 w-3.5 text-text-secondary" />
                    </div>
                  )}
                </div>
              )}
              
              <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[70%]`}>
                {!isMine && detail?.type === 'group' && isFirstInGroup && (
                  <span className="text-[12px] font-medium text-text-secondary ml-1 mb-1">{msg.sender.display_name}</span>
                )}
                <div 
                  className={`px-3 py-[6px] text-[15px] leading-[1.4] text-text-primary ${borderRadiusClass}
                    ${isMine ? 'bg-signal-blue' : 'bg-surface-2'}`}
                >
                  <span className="break-words">{msg.content}</span>
                  
                  {/* Inline Timestamp & Receipts (Signal style, bottom right of bubble) */}
                  <span className={`inline-flex items-center ml-3 text-[11px] float-right mt-1.5 leading-none translate-y-0.5
                    ${isMine ? 'text-white/70' : 'text-text-muted'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {isMine && (
                      <span className="ml-1 flex items-center justify-center text-[10px]">
                        {msg.status === 'sending' ? (
                          <span className="opacity-70">⋯</span>
                        ) : msg.status === 'sent' ? (
                          <span className="opacity-70 font-bold">✓</span>
                        ) : msg.status === 'delivered' ? (
                          <span className="opacity-70 font-bold">✓✓</span>
                        ) : (
                          <span className="font-bold">✓✓</span> // Read receipt
                        )}
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
      <div className="px-4 pb-4 pt-2 bg-bg-primary shrink-0 flex justify-center items-end">
        <form onSubmit={handleSend} className="flex items-center space-x-3 max-w-3xl w-full">
          <button 
            type="button" 
            className="h-10 w-10 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors shrink-0"
            title="Attachment"
          >
            <Plus className="h-[22px] w-[22px]" />
          </button>
          
          <div className="flex-1 bg-surface-2 rounded-full flex items-center min-h-[44px] px-1 transition-all relative border border-border-subtle focus-within:border-signal-blue/50">
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder="Signal message"
              className="w-full bg-transparent border-none focus:ring-0 py-2.5 pl-4 pr-11 outline-none text-text-primary placeholder:text-text-muted text-[14px]"
            />
            <button 
              type="button"
              className="absolute right-2 h-8 w-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
              title="Emoji"
            >
              <Smile className="h-5 w-5" />
            </button>
          </div>

          {!inputText.trim() ? (
            <button 
              type="button" 
              className="h-10 w-10 rounded-full hover:bg-surface-2 flex items-center justify-center text-text-muted hover:text-text-primary shrink-0 transition-colors"
              title="Voice Message"
            >
              <Mic className="h-[22px] w-[22px]" />
            </button>
          ) : (
            <button 
              type="submit" 
              className="h-10 w-10 rounded-full bg-signal-blue hover:bg-signal-blue-dark flex items-center justify-center text-white shrink-0 transition-colors shadow-sm"
              title="Send"
            >
              <Send className="h-[18px] w-[18px] ml-0.5" />
            </button>
          )}
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
