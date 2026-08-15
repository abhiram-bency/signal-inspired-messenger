'use client';

import React, { useState } from 'react';
import { X, User, Lock, Bell, Palette, Info, ChevronRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'profile' | 'privacy' | 'notifications' | 'appearance' | 'about';

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  if (!isOpen) return null;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'about', label: 'About', icon: Info },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-1 rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex max-h-[80vh] h-[600px] animate-in fade-in zoom-in-95 duration-200 border border-border">
        
        {/* Settings Sidebar */}
        <div className="w-1/3 border-r border-border bg-surface-2 flex flex-col shrink-0">
          <div className="h-16 flex items-center px-6 shrink-0 border-b border-border">
            <h2 className="text-xl font-semibold text-text-primary">Settings</h2>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-6 py-3 hover:bg-surface-3 transition-colors text-left ${
                    isActive ? 'bg-surface-3 text-signal-blue' : 'text-text-primary'
                  }`}
                >
                  <Icon className={`h-5 w-5 mr-4 ${isActive ? 'text-signal-blue' : 'text-text-muted'}`} />
                  <span className="flex-1 font-medium">{tab.label}</span>
                  {isActive && <ChevronRight className="h-4 w-4 text-signal-blue" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 flex flex-col bg-surface-1 overflow-hidden relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-text-muted hover:text-text-primary hover:bg-surface-3 rounded-full transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex-1 overflow-y-auto p-8 pt-16">
            {activeTab === 'profile' && (
              <div className="space-y-8 animate-in fade-in">
                <h3 className="text-2xl font-bold text-text-primary">Profile</h3>
                <div className="flex items-center space-x-6">
                  <div className="h-24 w-24 rounded-full bg-surface-3 flex items-center justify-center border border-border-subtle overflow-hidden">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-text-secondary" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xl font-medium text-text-primary">{user?.display_name}</h4>
                    <p className="text-text-muted mt-1">{user?.username ? `@${user.username}` : user?.phone}</p>
                    <button className="mt-3 px-4 py-2 bg-surface-3 hover:bg-surface-4 text-text-primary text-sm font-medium rounded-lg transition-colors">
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="text-2xl font-bold text-text-primary">Privacy</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-surface-2 rounded-xl border border-border-subtle">
                    <div>
                      <h4 className="font-medium text-text-primary">Read Receipts</h4>
                      <p className="text-sm text-text-muted mt-1">If turned off, you won&apos;t send or receive read receipts.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-surface-3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-signal-blue"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-surface-2 rounded-xl border border-border-subtle">
                    <div>
                      <h4 className="font-medium text-text-primary">Typing Indicators</h4>
                      <p className="text-sm text-text-muted mt-1">Let others know when you are typing.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-surface-3 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-signal-blue"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="text-2xl font-bold text-text-primary">Appearance</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-surface-2 rounded-xl border border-border-subtle">
                    <h4 className="font-medium text-text-primary mb-3">Theme</h4>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="theme" className="text-signal-blue focus:ring-signal-blue" defaultChecked />
                        <span className="text-text-primary text-sm">System</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="theme" className="text-signal-blue focus:ring-signal-blue" />
                        <span className="text-text-primary text-sm">Dark</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="theme" className="text-signal-blue focus:ring-signal-blue" disabled />
                        <span className="text-text-muted text-sm line-through">Light (Coming Soon)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Placeholders for others */}
            {(activeTab === 'notifications' || activeTab === 'about') && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 text-text-muted animate-in fade-in">
                {activeTab === 'notifications' ? <Bell className="h-12 w-12 opacity-20" /> : <Info className="h-12 w-12 opacity-20" />}
                <p>More settings coming in future updates.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
