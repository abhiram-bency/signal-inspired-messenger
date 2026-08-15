import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, UserPlus, User as UserIcon, Loader2, Check, UserMinus } from 'lucide-react';
import { fetchApiWithCredentials } from '../../lib/api';
import { User } from '../../types/user';
import { useChatStore } from '../../stores/chatStore';
import { ConversationListItem } from '../../types/chat';

interface Contact {
  id: string;
  contact: User;
  nickname: string | null;
  created_at: string;
}

interface ContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContactsModal({ isOpen, onClose }: ContactsModalProps) {
  const [activeTab, setActiveTab] = useState<'contacts' | 'search'>('contacts');
  
  // Contacts State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Action State
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const res = await fetchApiWithCredentials<{ data: Contact[] }>('/contacts');
      setContacts(res.data);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to load contacts');
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadContacts();
      setActiveTab('contacts');
      setSearchQuery('');
      setSearchResults([]);
      setError('');
    }
  }, [isOpen, loadContacts]);

  useEffect(() => {
    if (activeTab === 'search' && searchQuery.trim().length >= 2) {
      const delayFn = setTimeout(async () => {
        setSearching(true);
        try {
          const res = await fetchApiWithCredentials<{ data: User[] }>(`/users/search?q=${encodeURIComponent(searchQuery)}`);
          setSearchResults(res.data);
        } catch (err: unknown) {
          setError((err as Error).message || 'Search failed');
        } finally {
          setSearching(false);
        }
      }, 500);
      return () => clearTimeout(delayFn);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, activeTab]);

  const handleAddContact = async (userId: string) => {
    setActionLoading(userId);
    setError('');
    try {
      await fetchApiWithCredentials('/contacts', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });
      await loadContacts();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to add contact');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveContact = async (userId: string) => {
    setActionLoading(userId);
    setError('');
    try {
      await fetchApiWithCredentials(`/contacts/${userId}`, {
        method: 'DELETE',
      });
      await loadContacts();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to remove contact');
    } finally {
      setActionLoading(null);
    }
  };

  const { addConversation, setActiveConversationId } = useChatStore();

  const handleStartChat = async (userId: string) => {
    setActionLoading(userId);
    setError('');
    try {
      const res = await fetchApiWithCredentials<{ data: ConversationListItem }>('/conversations/direct', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId })
      });
      addConversation(res.data);
      setActiveConversationId(res.data.id);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to start chat');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-gray-50/50 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'contacts' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            My Contacts
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'search' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Find Users
          </button>
        </div>

        {error && (
          <div className="m-4 mb-0 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center shrink-0">
            {error}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          
          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div className="space-y-2">
              {loadingContacts ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center p-8 text-gray-500 text-sm">
                  <UserIcon className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                  <p>You don&apos;t have any contacts yet.</p>
                  <button 
                    onClick={() => setActiveTab('search')}
                    className="mt-4 text-blue-600 hover:underline"
                  >
                    Find people to chat with
                  </button>
                </div>
              ) : (
                contacts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                        {c.contact.avatar_url ? (
                          <img src={c.contact.avatar_url} alt={c.contact.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{c.nickname || c.contact.display_name}</div>
                        <div className="text-xs text-gray-500">{c.contact.username ? `@${c.contact.username}` : ''}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartChat(c.contact.id)}
                          disabled={actionLoading === c.contact.id}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {actionLoading === c.contact.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Message'}
                        </button>
                        <button
                          onClick={() => handleRemoveContact(c.contact.id)}
                          disabled={actionLoading === c.contact.id}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Remove contact"
                        >
                          {actionLoading === c.contact.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            )}

            {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="flex flex-col h-full">
              <div className="relative mb-4 shrink-0">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or username..." 
                  className="w-full bg-gray-100 rounded-xl py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex-1 space-y-2">
                {searching ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                  </div>
                ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                  <div className="text-center p-8 text-gray-500 text-sm">
                    No users found matching &quot;{searchQuery}&quot;
                  </div>
                ) : searchQuery.length < 2 ? (
                  <div className="text-center p-8 text-gray-400 text-sm">
                    Type at least 2 characters to search
                  </div>
                ) : (
                  searchResults.map((user) => {
                    const isContact = contacts.some(c => c.contact.id === user.id);
                    return (
                      <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon className="h-5 w-5 text-blue-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.display_name}</div>
                            <div className="text-xs text-gray-500">{user.username ? `@${user.username}` : ''}</div>
                          </div>
                        </div>
                        
                        {isContact ? (
                          <div className="px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded-lg flex items-center gap-1">
                            <Check className="h-3 w-3" /> Added
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddContact(user.id)}
                            disabled={actionLoading === user.id}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            {actionLoading === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
                            Add
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
