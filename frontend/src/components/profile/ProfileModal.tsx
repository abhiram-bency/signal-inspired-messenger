import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Camera, Loader2, Check } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { fetchApiWithCredentials } from '../../lib/api';

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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setDisplayName(user.display_name || '');
      setUsername(user.username || '');
      setAvatarUrl(user.avatar_url || '');
      setIsEditing(false);
      setError('');
      setSuccess(false);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

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
      setSuccess(true);
      setIsEditing(false);
      
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="h-16 border-b border-gray-100 flex items-center justify-between px-6 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Your Profile</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="h-10 w-10 text-blue-500" />
                )}
              </div>
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer transition-opacity">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              )}
            </div>
            {!isEditing && (
              <div className="text-center mt-4">
                <h3 className="text-xl font-bold text-gray-900">{user.display_name}</h3>
                <p className="text-sm text-gray-500 mt-1">{user.username ? `@${user.username}` : user.phone}</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm text-center flex items-center justify-center gap-2">
              <Check className="h-4 w-4" /> Profile updated successfully
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Your Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username (Optional)</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL (Optional)</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !displayName.trim()}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="pt-2">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
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
