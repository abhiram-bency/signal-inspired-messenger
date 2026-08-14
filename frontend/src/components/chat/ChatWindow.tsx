import React, { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useAuthStore } from '../../stores/authStore';
import { fetchApiWithCredentials } from '../../lib/api';
import { MessageResponse, ConversationDetail } from '../../types/chat';
import { Send, User, MoreVertical } from 'lucide-react';
import { wsClient } from '../../lib/websocket';

export function ChatWindow() {
  const { activeConversationId, messagesByConversation, setMessages, addMessage, updateMessageStatus } = useChatStore();
  const { user } = useAuthStore();
  const [inputText, setInputText] = useState('');
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

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

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversationId || !user) return;

    const content = inputText.trim();
    setInputText('');

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

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 h-full">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Send className="h-8 w-8 text-blue-500 ml-1" />
        </div>
        <h2 className="text-xl font-medium text-gray-700">Signal-Inspired Messenger</h2>
        <p className="text-gray-500 mt-2">Select a conversation to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F9FAFB] h-full">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
             {detail?.avatar_url ? (
               <img src={detail.avatar_url} alt="Avatar" className="h-full w-full rounded-full object-cover" />
             ) : (
               <User className="h-5 w-5 text-blue-600" />
             )}
          </div>
          <div className="ml-3">
            <h2 className="font-medium text-gray-900">{detail?.name || 'Loading...'}</h2>
            <p className="text-xs text-gray-500">
              {detail?.type === 'direct' ? 'Direct Message' : `${detail?.members?.length || 0} members`}
            </p>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse">
        <div ref={messagesEndRef} />
        {messages.map((msg, idx) => {
          const isMine = msg.sender.id === user?.id;
          const showAvatar = !isMine && (idx === messages.length - 1 || messages[idx + 1]?.sender.id !== msg.sender.id);
          
          return (
            <div key={msg.id} className={`flex w-full mb-3 ${isMine ? 'justify-end' : 'justify-start'}`}>
              {!isMine && (
                <div className="w-8 shrink-0 mr-2 flex flex-col justify-end">
                  {showAvatar && (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                  )}
                </div>
              )}
              
              <div className={`max-w-[70%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                <div 
                  className={`px-4 py-2 rounded-2xl shadow-sm text-[15px] leading-relaxed
                    ${isMine 
                      ? 'bg-blue-600 text-white rounded-br-sm' 
                      : 'bg-white text-gray-900 border border-gray-100 rounded-bl-sm'
                    }`}
                >
                  {msg.content}
                </div>
                <div className={`text-[11px] text-gray-400 mt-1 flex items-center ${isMine ? 'justify-end' : 'justify-start'} w-full px-1`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isMine && (
                    <span className="ml-1.5 opacity-70">
                      {msg.status === 'sending' ? '⋯' : msg.status === 'sent' ? '✓' : '✓✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {loading && <div className="text-center text-sm text-gray-400 py-4">Loading messages...</div>}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSend} className="flex items-end space-x-2 max-w-4xl mx-auto">
          <div className="flex-1 bg-gray-100 rounded-3xl flex items-end min-h-[44px] overflow-hidden border border-transparent focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-sm transition-all">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Message..."
              className="w-full bg-transparent border-none focus:ring-0 py-3 px-5 outline-none"
            />
          </div>
          <button 
            type="submit" 
            disabled={!inputText.trim()}
            className="h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center text-white shrink-0 transition-colors shadow-sm"
          >
            <Send className="h-5 w-5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
