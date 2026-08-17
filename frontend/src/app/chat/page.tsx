"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores/authStore';
import { useChatStore } from '../../stores/chatStore';
import { useTypingStore } from '../../stores/typingStore';
import { WsEvent, MessageResponse } from '../../types/chat';
import { Sidebar } from '../../components/chat/Sidebar';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { ProfileModal } from '../../components/profile/ProfileModal';
import { ContactsModal } from '../../components/contacts/ContactsModal';
import { SettingsModal } from '../../components/settings/SettingsModal';
import { wsClient } from '../../lib/websocket';
import { LogOut, Shield, User as UserIcon, Users, Settings } from 'lucide-react';

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, user, restoreSession, logout: authLogout } = useAuthStore();
  const { setConnectionReady, addMessage, updateMessageStatus, logout: chatLogout, activeConversationId } = useChatStore();
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isContactsOpen, setIsContactsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
          const convId = msg.conversation_id as string;
          const msgId = msg.id as string;
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          addMessage(convId, msg as unknown as any);

          // Send delivery receipt
          wsClient.send('receipt.update', {
            message_id: msgId,
            conversation_id: convId,
            status: 'delivered'
          });

          // Send read receipt if active
          const activeConvId = useChatStore.getState().activeConversationId;
          if (activeConvId === convId) {
            wsClient.send('receipt.update', {
              message_id: msgId,
              conversation_id: convId,
              status: 'read'
            });
          }
        }
      };

      const handleReceipt = (event: WsEvent) => {
        const payload = event.payload as Record<string, unknown>;
        if (payload.message_id && payload.conversation_id && payload.status) {
          useChatStore.getState().updateMessageReceipt(
            payload.conversation_id as string,
            payload.message_id as string,
            payload.status as MessageResponse['status']
          );
        }
      };

      const handleTypingStart = (event: WsEvent) => {
        const payload = event.payload as Record<string, unknown>;
        if (payload.conversation_id && payload.user_id && payload.display_name) {
          useTypingStore.getState().addTypingUser(
            payload.conversation_id as string,
            payload.user_id as string,
            payload.display_name as string
          );
        }
      };

      const handleTypingStop = (event: WsEvent) => {
        const payload = event.payload as Record<string, unknown>;
        if (payload.conversation_id && payload.user_id) {
          useTypingStore.getState().removeTypingUser(
            payload.conversation_id as string,
            payload.user_id as string
          );
        }
      };

      wsClient.on('connection.ready', handleReady);
      wsClient.on('message.ack', handleAck);
      wsClient.on('message.new', handleNew);
      wsClient.on('receipt.update', handleReceipt);
      wsClient.on('typing.start', handleTypingStart);
      wsClient.on('typing.stop', handleTypingStop);

      return () => {
        wsClient.off('connection.ready', handleReady);
        wsClient.off('message.ack', handleAck);
        wsClient.off('message.new', handleNew);
        wsClient.off('receipt.update', handleReceipt);
        wsClient.off('typing.start', handleTypingStart);
        wsClient.off('typing.stop', handleTypingStop);
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
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-pulse flex flex-col items-center">
          <Shield className="h-10 w-10 text-signal-blue mb-4" />
          <p className="text-text-muted font-medium">Connecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-bg-primary overflow-hidden text-text-primary font-sans antialiased">
      {/* Side Navigation (App Rail) */}
      <div className={`w-[60px] bg-bg-primary flex-col items-center py-4 justify-between shrink-0 z-20 ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex flex-col items-center space-y-6">
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="w-9 h-9 rounded-full bg-surface-3 text-text-primary flex items-center justify-center hover:opacity-80 transition-opacity ring-2 ring-transparent hover:ring-signal-blue/50" 
            title={user.display_name}
          >
            {user.avatar_url ? (
               <img src={user.avatar_url} alt="Profile" className="w-9 h-9 rounded-full object-cover" />
            ) : (
               <UserIcon className="h-5 w-5 text-text-secondary" />
            )}
          </button>
          <button 
            onClick={() => setIsContactsOpen(true)}
            className="w-10 h-10 rounded-xl text-text-secondary flex items-center justify-center hover:bg-surface-2 hover:text-text-primary transition-colors" 
            title="Contacts"
          >
            <Users className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col items-center space-y-4">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-xl text-text-secondary flex items-center justify-center hover:bg-surface-2 hover:text-text-primary transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button 
            onClick={handleLogout}
            className="w-10 h-10 rounded-xl text-text-secondary flex items-center justify-center hover:bg-surface-2 hover:text-error transition-colors"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex min-w-0">
        <div className={`w-full md:w-[320px] lg:w-[360px] shrink-0 border-r border-border-subtle bg-surface-1 ${activeConversationId ? 'hidden md:block' : 'block'}`}>
          <Sidebar onOpenContacts={() => setIsContactsOpen(true)} />
        </div>
        <div className={`flex-1 min-w-0 bg-bg-primary ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
          <ChatWindow />
        </div>
      </div>
      
      {/* Modals */}
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
      <ContactsModal 
        isOpen={isContactsOpen} 
        onClose={() => setIsContactsOpen(false)} 
      />
      {isSettingsOpen && (
        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}
    </div>
  );
}
