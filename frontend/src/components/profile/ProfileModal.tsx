import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Camera, Loader2, Check } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { fetchApiWithCredentials } from '../../lib/api';
import { useToastStore } from '../../stores/toastStore';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, setUser } = useAuthStore();
  
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const addToast = useToastStore((state) => state.addToast);

  useEffect(() => {
    if (user && isOpen) {
      setDisplayName(user.display_name || '');
      setUsername(user.username || '');
      setAvatarUrl(user.avatar_url || '');
      setIsEditing(false);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      addToast('Display name is required', 'error');
      return;
    }

    setLoading(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await fetchApiWithCredentials<{ data: any }>('/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          display_name: displayName.trim(),
          username: username.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        }),
      });

      setUser(res.data);
      addToast('Profile updated successfully', 'success');
      setIsEditing(false);
    } catch (err: unknown) {
      addToast((err as Error).message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-1 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-border">
        
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-surface-2">
          <h2 className="text-lg font-semibold text-text-primary">Profile</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-text-muted hover:text-text-primary hover:bg-surface-3 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-surface-3 flex items-center justify-center overflow-hidden border-2 border-border-subtle shadow-sm">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="h-10 w-10 text-text-secondary" />
                )}
              </div>
              {isEditing && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center cursor-pointer transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              )}
            </div>
            {!isEditing && (
              <div className="text-center mt-4">
                <h3 className="text-xl font-bold text-text-primary">{user.display_name}</h3>
                <p className="text-sm text-text-muted mt-1">{user.username ? `@${user.username}` : user.phone}</p>
              </div>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-2 border border-border-subtle rounded-xl focus:ring-1 focus:ring-signal-blue outline-none transition-all text-text-primary placeholder:text-text-muted"
                  placeholder="Your Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Username (Optional)</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-2 border border-border-subtle rounded-xl focus:ring-1 focus:ring-signal-blue outline-none transition-all text-text-primary placeholder:text-text-muted"
                  placeholder="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Avatar URL (Optional)</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-surface-2 border border-border-subtle rounded-xl focus:ring-1 focus:ring-signal-blue outline-none transition-all text-text-primary placeholder:text-text-muted"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-text-primary bg-surface-2 hover:bg-surface-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !displayName.trim()}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-signal-blue hover:bg-signal-blue-dark rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </button>
              </div>
            </form>
          ) : (
            <div className="pt-2">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full px-4 py-2.5 text-sm font-medium text-text-primary bg-surface-2 hover:bg-surface-3 rounded-xl transition-colors"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
