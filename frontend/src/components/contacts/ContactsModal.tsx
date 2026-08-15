import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, UserPlus, User as UserIcon, Loader2, Check, UserMinus } from 'lucide-react';
import { fetchApiWithCredentials } from '../../lib/api';
import { User } from '../../types/user';
import { useChatStore } from '../../stores/chatStore';
import { useToastStore } from '../../stores/toastStore';
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
  const [activeTab, setActiveTab] = useState<'contacts' | 'search' | 'create_group'>('contacts');
  
  // Contacts State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Action State
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const addToast = useToastStore((state) => state.addToast);

  // Group State
  const [groupName, setGroupName] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  const loadContacts = useCallback(async () => {
    setLoadingContacts(true);
    try {
      const res = await fetchApiWithCredentials<{ data: Contact[] }>('/contacts');
      setContacts(res.data);
    } catch (err: unknown) {
      addToast((err as Error).message || 'Failed to load contacts', 'error');
    } finally {
      setLoadingContacts(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (isOpen) {
      loadContacts();
      setActiveTab('contacts');
      setSearchQuery('');
      setSearchResults([]);
      setGroupName('');
      setSelectedContactIds([]);
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
          addToast((err as Error).message || 'Search failed', 'error');
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
    try {
      await fetchApiWithCredentials('/contacts', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      });
      await loadContacts();
      addToast('Contact added', 'success');
    } catch (err: unknown) {
      addToast((err as Error).message || 'Failed to add contact', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveContact = async (userId: string) => {
    setActionLoading(userId);
    try {
      await fetchApiWithCredentials(`/contacts/${userId}`, {
        method: 'DELETE',
      });
      await loadContacts();
      addToast('Contact removed', 'success');
    } catch (err: unknown) {
      addToast((err as Error).message || 'Failed to remove contact', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const { addConversation, setActiveConversationId } = useChatStore();

  const handleStartChat = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetchApiWithCredentials<{ data: ConversationListItem }>('/conversations/direct', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId })
      });
      addConversation(res.data);
      setActiveConversationId(res.data.id);
      onClose();
    } catch (err: unknown) {
      addToast((err as Error).message || 'Failed to start chat', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedContactIds.length === 0) return;
    setActionLoading('create_group');
    try {
      const res = await fetchApiWithCredentials<{ data: ConversationListItem }>('/conversations/group', {
        method: 'POST',
        body: JSON.stringify({ name: groupName.trim(), member_ids: selectedContactIds })
      });
      addConversation(res.data);
      setActiveConversationId(res.data.id);
      onClose();
    } catch (err: unknown) {
      addToast((err as Error).message || 'Failed to create group', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-1 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200 border border-border">
        
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-surface-2 shrink-0">
          <h2 className="text-lg font-semibold text-text-primary">Contacts</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-text-muted hover:text-text-primary hover:bg-surface-3 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border shrink-0 bg-surface-1">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'contacts' ? 'border-signal-blue text-signal-blue' : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-2'
            }`}
          >
            My Contacts
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'search' ? 'border-signal-blue text-signal-blue' : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-2'
            }`}
          >
            Find Users
          </button>
          <button
            onClick={() => setActiveTab('create_group')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'create_group' ? 'border-signal-blue text-signal-blue' : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-2'
            }`}
          >
            Create Group
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          
          {/* Contacts Tab */}
          {activeTab === 'contacts' && (
            <div className="space-y-2">
              {loadingContacts ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 text-signal-blue animate-spin" />
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center p-8 text-text-muted text-sm">
                  <UserIcon className="h-10 w-10 mx-auto text-text-secondary mb-3" />
                  <p>You don&apos;t have any contacts yet.</p>
                  <button 
                    onClick={() => setActiveTab('search')}
                    className="mt-4 text-signal-blue hover:underline"
                  >
                    Find people to chat with
                  </button>
                </div>
              ) : (
                contacts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 hover:bg-surface-2 rounded-xl transition-colors border border-transparent hover:border-border-subtle">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center overflow-hidden border border-border-subtle">
                        {c.contact.avatar_url ? (
                          <img src={c.contact.avatar_url} alt={c.contact.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="h-5 w-5 text-text-secondary" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-text-primary">{c.nickname || c.contact.display_name}</div>
                        <div className="text-xs text-text-muted">{c.contact.username ? `@${c.contact.username}` : ''}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStartChat(c.contact.id)}
                          disabled={actionLoading === c.contact.id}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-signal-blue hover:bg-signal-blue-dark rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          {actionLoading === c.contact.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Message'}
                        </button>
                        <button
                          onClick={() => handleRemoveContact(c.contact.id)}
                          disabled={actionLoading === c.contact.id}
                          className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
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
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-muted" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or username..." 
                  className="w-full bg-surface-2 border border-border-subtle rounded-xl py-2 pl-9 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-signal-blue"
                />
              </div>

              <div className="flex-1 space-y-2">
                {searching ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-6 w-6 text-signal-blue animate-spin" />
                  </div>
                ) : searchResults.length === 0 && searchQuery.length >= 2 ? (
                  <div className="text-center p-8 text-text-muted text-sm">
                    No users found matching &quot;{searchQuery}&quot;
                  </div>
                ) : searchQuery.length < 2 ? (
                  <div className="text-center p-8 text-text-secondary text-sm">
                    Type at least 2 characters to search
                  </div>
                ) : (
                  searchResults.map((user) => {
                    const isContact = contacts.some(c => c.contact.id === user.id);
                    return (
                      <div key={user.id} className="flex items-center justify-between p-3 hover:bg-surface-2 rounded-xl transition-colors border border-transparent hover:border-border-subtle">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-surface-2 border border-border-subtle flex items-center justify-center overflow-hidden">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon className="h-5 w-5 text-text-secondary" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-text-primary">{user.display_name}</div>
                            <div className="text-xs text-text-muted">{user.username ? `@${user.username}` : ''}</div>
                          </div>
                        </div>
                        
                        {isContact ? (
                          <div className="px-3 py-1.5 text-xs font-medium text-success bg-success/10 rounded-lg flex items-center gap-1">
                            <Check className="h-3 w-3" /> Added
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddContact(user.id)}
                            disabled={actionLoading === user.id}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-signal-blue hover:bg-signal-blue-dark rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
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

          {/* Create Group Tab */}
          {activeTab === 'create_group' && (
            <div className="flex flex-col h-full space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Group Name</label>
                <input 
                  type="text" 
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Project Team" 
                  className="w-full bg-surface-2 border border-border-subtle rounded-xl py-2 px-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-signal-blue"
                />
              </div>

              <div className="flex-1 flex flex-col min-h-0">
                <label className="block text-sm font-medium text-text-secondary mb-1">Select Members</label>
                <div className="flex-1 overflow-y-auto space-y-1 bg-surface-2 rounded-xl p-2 border border-border-subtle">
                  {contacts.length === 0 ? (
                    <div className="text-center p-4 text-text-muted text-xs">
                      You need contacts to create a group.
                    </div>
                  ) : (
                    contacts.map(c => (
                      <label key={c.id} className="flex items-center p-2 hover:bg-surface-3 rounded-lg cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedContactIds.includes(c.contact.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedContactIds(prev => [...prev, c.contact.id]);
                            } else {
                              setSelectedContactIds(prev => prev.filter(id => id !== c.contact.id));
                            }
                          }}
                          className="h-4 w-4 text-signal-blue rounded border-border focus:ring-signal-blue bg-surface-1"
                        />
                        <div className="ml-3 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-surface-3 flex items-center justify-center overflow-hidden shrink-0 border border-border-subtle">
                            {c.contact.avatar_url ? (
                              <img src={c.contact.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon className="h-3 w-3 text-text-secondary" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-text-primary">{c.nickname || c.contact.display_name}</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <button
                onClick={handleCreateGroup}
                disabled={actionLoading === 'create_group' || !groupName.trim() || selectedContactIds.length === 0}
                className="w-full py-2.5 bg-signal-blue hover:bg-signal-blue-dark disabled:bg-surface-3 disabled:text-text-muted text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {actionLoading === 'create_group' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Group'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
