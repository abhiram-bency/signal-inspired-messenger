"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { WsEvent } from '../../types/chat';
import { Sidebar } from '../../components/chat/Sidebar';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { wsClient } from '../../lib/websocket';
import { LogOut, Shield, User as UserIcon } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, user, restoreSession, logout: authLogout } = useAuthStore();
  const { setConnectionReady, addMessage, updateMessageStatus, logout: chatLogout } = useChatStore();

  useEffect(() => {
    // Basic auth check
    restoreSession().catch(() => {
      // Ignore
    });
  }, [restoreSession]);

  useEffect(() => {
    if (isAuthenticated === false) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      // Connect WS
      wsClient.connect();

      // Handlers
      const handleReady = () => setConnectionReady(true);
      const handleAck = (event: WsEvent) => {
        const payload = event.payload as Record<string, unknown>;
        if (payload.message && payload.client_message_id) {
          updateMessageStatus(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (payload.message as any).conversation_id as string, 
            payload.client_message_id as string, 
            {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ...(payload.message as any),
              status: 'sent'
            }
          );
        }
      };
      const handleNew = (event: WsEvent) => {
        const msg = event.payload as Record<string, unknown>;
        if (msg && msg.conversation_id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          addMessage(msg.conversation_id as string, msg as unknown as any);
        }
      };

      wsClient.on('connection.ready', handleReady);
      wsClient.on('message.ack', handleAck);
      wsClient.on('message.new', handleNew);

      return () => {
        wsClient.off('connection.ready', handleReady);
        wsClient.off('message.ack', handleAck);
        wsClient.off('message.new', handleNew);
        wsClient.disconnect();
      };
    }
  }, [isAuthenticated, setConnectionReady, addMessage, updateMessageStatus]);

  const handleLogout = async () => {
    try {
      await authLogout();
      chatLogout();
      wsClient.disconnect();
      router.push('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <Shield className="h-10 w-10 text-blue-500 mb-4" />
          <p className="text-gray-500 font-medium">Connecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden text-gray-900 font-sans antialiased">
      {/* Side Navigation (App Rail) */}
      <div className="w-16 bg-gray-900 flex flex-col items-center py-4 justify-between shrink-0 z-20">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg text-white font-bold text-lg mb-2">
            S
          </div>
          <button className="w-10 h-10 rounded-lg bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition-colors" title={user.display_name}>
            <UserIcon className="h-5 w-5" />
          </button>
        </div>
        <button 
          onClick={handleLogout}
          className="w-10 h-10 rounded-lg text-gray-400 flex items-center justify-center hover:bg-gray-800 hover:text-white transition-colors"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex min-w-0">
        <Sidebar />
        <ChatWindow />
      </div>
    </div>
  );
}
