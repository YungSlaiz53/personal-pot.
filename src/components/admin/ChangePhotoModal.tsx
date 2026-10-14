import React, { useState, useRef } from 'react';
import { Camera, Upload, Link as LinkIcon, Check, X, AlertCircle, RefreshCw, Sparkles, Image as ImageIcon } from 'lucide-react';
import { api } from '../../services/api';

interface ChangePhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl: string;
  onPhotoUpdated: (newUrl: string) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80'
];

export const ChangePhotoModal: React.FC<ChangePhotoModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  onPhotoUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>(currentAvatarUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP, or GIF).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError('Selected image exceeds the 25MB avatar size limit.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    // Create temporary object URL for instant visual feedback
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const res = await api.admin.uploadPhoto(file, 'avatar');
      if (res.success && res.avatarUrl) {
        setPreviewUrl(res.avatarUrl);
        setSuccess('Profile photo updated successfully!');
        onPhotoUpdated(res.avatarUrl);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        throw new Error('Upload failed to return valid image URL');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
      setPreviewUrl(currentAvatarUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyUrl = async () => {
    if (!urlInput.trim()) {
      setError('Please enter a valid image web URL.');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.admin.updateAvatar(urlInput.trim());
      if (res.success) {
        setPreviewUrl(res.avatarUrl);
        setSuccess('Profile photo updated from URL!');
        onPhotoUpdated(res.avatarUrl);
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update avatar URL');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectPreset = async (presetUrl: string) => {
    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setPreviewUrl(presetUrl);

    try {
      const res = await api.admin.updateAvatar(presetUrl);
      if (res.success) {
        setSuccess('Preset avatar applied successfully!');
        onPhotoUpdated(res.avatarUrl);
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to apply preset');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#080A0E] border border-[#331018] rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(255,0,60,0.35)] overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[#FF003C]/20 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[#20131A] relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#1C0A10] border border-[#FF003C]/40 text-[#FF003C] flex items-center justify-center shadow-[0_0_15px_rgba(255,0,60,0.4)]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Change Profile Photo
              </h2>
              <p className="text-xs text-slate-400">
                Upload a picture from your device or paste an image link
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1C1217] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Photo Preview */}
        <div className="py-6 flex flex-col items-center justify-center relative z-10">
          <div className="relative group">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-[2px] bg-gradient-to-tr from-[#FF003C] via-[#FF3B60] to-[#88001F] shadow-[0_0_30px_rgba(255,0,60,0.55)]">
              <div className="w-full h-full rounded-[22px] overflow-hidden bg-[#050608]">
                <img
                  src={previewUrl || currentAvatarUrl}
                  alt="Profile Preview"
                  className="w-full h-full object-cover"
                  onError={() => {
                    setPreviewUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80');
                  }}
                />
              </div>
            </div>
            {isUploading && (
              <div className="absolute inset-0 bg-black/70 rounded-3xl flex items-center justify-center">
                <RefreshCw className="w-7 h-7 text-[#FF003C] animate-spin" />
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium">Current Profile Photo</p>
        </div>

        {/* Error / Success Feedback */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{success}</span>
          </div>
        )}

        {/* Tab Selection */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-[#050608] border border-[#20131A] rounded-xl mb-4 relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'upload'
                ? 'bg-[#FF003C] text-white shadow-[0_0_15px_rgba(255,0,60,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'url'
                ? 'bg-[#FF003C] text-white shadow-[0_0_15px_rgba(255,0,60,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Image URL</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'presets'
                ? 'bg-[#FF003C] text-white shadow-[0_0_15px_rgba(255,0,60,0.5)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Presets</span>
          </button>
        </div>

        {/* Tab 1: Upload File */}
        {activeTab === 'upload' && (
          <div className="space-y-3 relative z-10">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 border-2 border-dashed border-[#331018] hover:border-[#FF003C] rounded-2xl bg-[#0B0E14] flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-[#120B10] group"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#1C0A10] border border-[#FF003C]/30 text-[#FF003C] flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(255,0,60,0.3)] group-hover:scale-110 transition-transform">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white mb-1">
                Click to browse photo from your device
              </p>
              <p className="text-xs text-slate-400">
                Supports JPG, PNG, WEBP, or GIF (up to 25MB)
              </p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF003C] to-[#C9002E] hover:from-[#FF1E46] hover:to-[#FF003C] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,0,60,0.45)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
              <span>{isUploading ? 'Uploading Photo...' : 'Choose Photo From Device'}</span>
            </button>
          </div>
        )}

        {/* Tab 2: URL Input */}
        {activeTab === 'url' && (
          <div className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Paste Image Direct URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/my-photo.jpg"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (e.target.value.startsWith('http')) {
                    setPreviewUrl(e.target.value);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050608] border border-[#20131A] text-white text-xs focus:outline-none focus:border-[#FF003C] focus:ring-1 focus:ring-[#FF003C]"
              />
            </div>

            <button
              type="button"
              onClick={handleApplyUrl}
              disabled={isUploading || !urlInput.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF003C] to-[#C9002E] hover:from-[#FF1E46] hover:to-[#FF003C] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(255,0,60,0.45)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>Apply Photo URL</span>
            </button>
          </div>
        )}

        {/* Tab 3: Presets */}
        {activeTab === 'presets' && (
          <div className="space-y-3 relative z-10">
            <p className="text-xs text-slate-400">Select one of our curated high-resolution portraits:</p>
            <div className="grid grid-cols-3 gap-3">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(url)}
                  disabled={isUploading}
                  className="aspect-square rounded-2xl overflow-hidden border-2 border-[#20131A] hover:border-[#FF003C] transition-all hover:scale-105 shadow-sm group relative"
                >
                  <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-[#FF003C]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Check className="w-5 h-5 text-white drop-shadow" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
