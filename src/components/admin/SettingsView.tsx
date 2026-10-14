import React, { useState, useEffect, useRef } from 'react';
import {
  Settings,
  User,
  Shield,
  Download,
  Key,
  Save,
  CheckCircle2,
  AlertCircle,
  Database,
  Mail,
  Camera,
  Upload,
  Sparkles,
  Link as LinkIcon,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { VaultSettings } from '../../types/vault';
import { api } from '../../services/api';

interface SettingsViewProps {
  initialSettings: VaultSettings | null;
  onSettingsUpdated: () => void;
}

const ALL_CATEGORY_OPTIONS = [
  'CV and Resume',
  'Web Development',
  'Graphic Design',
  'Certificates',
  'Video Projects',
  'Documents',
  'Social Media Marketing',
  'Personal Projects',
  'Resources and Links'
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80'
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  initialSettings,
  onSettingsUpdated
}) => {
  const [settings, setSettings] = useState<VaultSettings | null>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Photo change state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  if (!settings) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-[#FF003C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Handle uploading a new profile photo directly
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WEBP, or GIF).');
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoMessage(null);
    setErrorMessage(null);

    try {
      const res = await api.admin.uploadPhoto(file, 'avatar');
      if (res.success && res.avatarUrl) {
        setSettings((prev) => prev ? { ...prev, avatarUrl: res.avatarUrl } : null);
        setPhotoMessage('Profile photo updated and saved to vault successfully!');
        onSettingsUpdated();
        setTimeout(() => setPhotoMessage(null), 4000);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyPresetPhoto = async (url: string) => {
    setIsUploadingPhoto(true);
    setPhotoMessage(null);
    setErrorMessage(null);

    try {
      const res = await api.admin.updateAvatar(url);
      if (res.success) {
        setSettings((prev) => prev ? { ...prev, avatarUrl: url } : null);
        setPhotoMessage('Preset portrait applied and saved successfully!');
        onSettingsUpdated();
        setTimeout(() => setPhotoMessage(null), 3000);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to apply preset');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await api.admin.updateSettings(settings);
      setSuccessMessage('Vault settings and profile configurations saved successfully.');
      onSettingsUpdated();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to save settings');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await api.auth.changePassword(currentPassword, newPassword);
      setPasswordSuccess(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPasswordError(err.message);
      } else {
        setPasswordError('Failed to change password');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExportBackup = () => {
    window.location.href = '/api/admin/export-metadata';
  };

  const toggleCategoryVisibility = (cat: string) => {
    const list = settings.visibleCategories || [];
    const updated = list.includes(cat) ? list.filter((c) => c !== cat) : [...list, cat];
    setSettings({ ...settings, visibleCategories: updated });
  };

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      {/* Top Banner - Neon Red & Black */}
      <div className="vault-panel rounded-2xl p-6 border-l-4 border-l-[#FF003C] shadow-[0_0_30px_-5px_rgba(255,0,60,0.15)]">
        <h2 className="text-lg font-black text-white flex items-center gap-2.5">
          <Settings className="w-5 h-5 text-[#FF003C]" />
          <span>Vault Preferences & Public Portfolio Configuration</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
          Manage your public branding, profile photo, biography, default file permissions, and secure backup archives.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(255,0,60,0.3)]">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {photoMessage && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-[#FF003C]/50 text-red-200 text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(255,0,60,0.3)]">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#FF003C]" />
          <span>{photoMessage}</span>
        </div>
      )}

      {/* Profile Photo Studio Section */}
      <div className="vault-panel rounded-2xl p-6 space-y-5 text-xs relative overflow-hidden border border-[#221219]">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF003C]/10 blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-[#20131A] pb-3">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#FF003C]" />
            <span>Profile Photo & Avatar Studio</span>
          </h3>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FF003C]/15 border border-[#FF003C]/30 text-[#FF4D6D]">
            Live Sync
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-2">
          {/* Avatar Preview with Neon Glow */}
          <div className="relative shrink-0 flex flex-col items-center">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-[2px] bg-gradient-to-tr from-[#FF003C] via-[#FF2B4D] to-[#88001F] shadow-[0_0_30px_rgba(255,0,60,0.45)] group">
              <div className="w-full h-full rounded-[22px] overflow-hidden bg-[#050608] relative">
                <img
                  src={settings.avatarUrl}
                  alt={settings.ownerName}
                  className="w-full h-full object-cover"
                />
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-[#FF003C] animate-spin" />
                  </div>
                )}
              </div>
            </div>
            <span className="mt-2 text-[11px] font-semibold text-slate-400">Current Photo</span>
          </div>

          {/* Upload Controls */}
          <div className="flex-1 space-y-4 w-full">
            <div>
              <p className="text-xs font-bold text-white mb-1">Upload New Picture</p>
              <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                Upload your real photo from your computer or phone. Supported formats include JPG, PNG, WEBP, or GIF.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF003C] to-[#C9002E] hover:from-[#FF1E46] hover:to-[#FF003C] text-white font-bold text-xs shadow-[0_0_20px_rgba(255,0,60,0.4)] flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploadingPhoto ? 'Uploading...' : 'Choose Photo From Device'}</span>
                </button>
              </div>
            </div>

            {/* Direct URL input */}
            <div className="pt-2 border-t border-[#1C1217]">
              <label className="block font-medium text-slate-300 mb-1.5">
                Or Edit Image Web URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.avatarUrl}
                  onChange={(e) => setSettings({ ...settings, avatarUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-[#050608] border border-[#20131A] text-white focus:outline-none focus:border-[#FF003C] text-xs"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (settings.avatarUrl) {
                      await handleApplyPresetPhoto(settings.avatarUrl);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#1C1217] hover:bg-[#2A1620] text-slate-200 border border-[#331018] hover:border-[#FF003C] font-semibold text-xs cursor-pointer transition-colors"
                >
                  Apply URL
                </button>
              </div>
            </div>

            {/* Presets */}
            <div className="pt-2 border-t border-[#1C1217]">
              <p className="text-[11px] font-semibold text-slate-400 mb-2">
                Quick Preset Portraits:
              </p>
              <div className="flex flex-wrap gap-2">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPresetPhoto(url)}
                    className="w-9 h-9 rounded-xl overflow-hidden border border-[#20131A] hover:border-[#FF003C] hover:scale-110 transition-all shadow-sm"
                    title={`Preset ${idx + 1}`}
                  >
                    <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Details Card */}
        <div className="vault-panel rounded-2xl p-6 space-y-4 text-xs border border-[#20131A]">
          <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-[#1C1217] pb-3">
            <User className="w-4 h-4 text-[#FF003C]" />
            <span>Public Identity & Biography</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">Vault Brand Name</label>
              <input
                type="text"
                value={settings.portfolioName}
                onChange={(e) => setSettings({ ...settings, portfolioName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050608] border border-[#20131A] text-white focus:outline-none focus:border-[#FF003C]"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1.5">Your Full Name</label>
              <input
                type="text"
                value={settings.ownerName}
                onChange={(e) => setSettings({ ...settings, ownerName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050608] border border-[#20131A] text-white focus:outline-none focus:border-[#FF003C]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-300 mb-1.5">Professional Title / Headline</label>
              <input
                type="text"
                value={settings.ownerTitle}
                onChange={(e) => setSettings({ ...settings, ownerTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050608] border border-[#20131A] text-white focus:outline-none focus:border-[#FF003C]"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1.5">Professional Biography</label>
            <textarea
              value={settings.bio}
              onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#050608] border border-[#20131A] text-white focus:outline-none focus:border-[#FF003C]"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1.5">Public Portfolio Introduction Notice</label>
            <textarea
              value={settings.publicIntroduction}
              onChange={(e) => setSettings({ ...settings, publicIntroduction: e.target.value })}
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#050608] border border-[#20131A] text-white focus:outline-none focus:border-[#FF003C]"
            />
          </div>
        </div>

        {/* Contact & Social Links */}
        <div className="vault-panel rounded-2xl p-6 space-y-4 text-xs border border-[#20131A]">
          <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-[#1C1217] pb-3">
            <Mail className="w-4 h-4 text-[#FF003C]" />
            <span>Contact Information & Social Channels</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">Public Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050608] border border-[#20131A] text-white focus:outline-none focus:border-[#FF003C]"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">Phone (Optional)</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050608] border border-[#20131A] text-white focus:outline-none focus:border-[#FF003C]"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">Location</label>
              <input
                type="text"
                value={settings.location || 'Nigeria'}
                onChange={(e) => setSettings({ ...settings, location: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050608] border border-[#20131A] text-white focus:outline-none focus:border-[#FF003C]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">GitHub Profile URL</label>
              <input
                type="text"
                value={settings.socialLinks?.github || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socialLinks: { ...settings.socialLinks, github: e.target.value }
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050608] border border-[#20131A] text-white focus:outline-none focus:border-[#FF003C]"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">LinkedIn Profile URL</label>
              <input
                type="text"
                value={settings.socialLinks?.linkedin || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socialLinks: { ...settings.socialLinks, linkedin: e.target.value }
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050608] border border-[#20131A] text-white focus:outline-none focus:border-[#FF003C]"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">Twitter / X URL</label>
              <input
                type="text"
                value={settings.socialLinks?.twitter || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    socialLinks: { ...settings.socialLinks, twitter: e.target.value }
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050608] border border-[#20131A] text-white focus:outline-none focus:border-[#FF003C]"
              />
            </div>
          </div>
        </div>

        {/* Default Upload & Policy Settings */}
        <div className="vault-panel rounded-2xl p-6 space-y-4 text-xs border border-[#20131A]">
          <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-[#1C1217] pb-3">
            <Shield className="w-4 h-4 text-[#FF003C]" />
            <span>Default Upload & Permissions Policies</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-300 mb-1.5">
                Default Upload Visibility
              </label>
              <select
                value={settings.defaultVisibility}
                onChange={(e) =>
                  setSettings({ ...settings, defaultVisibility: e.target.value as any })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050608] border border-[#20131A] text-white focus:outline-none focus:border-[#FF003C]"
              >
                <option value="public">Public (Visible on Portfolio by default)</option>
                <option value="private">Private (Restricted to Admin vault by default)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-300 mb-1.5">
                Default Download Policy
              </label>
              <select
                value={String(settings.defaultDownloadAllowed)}
                onChange={(e) =>
                  setSettings({ ...settings, defaultDownloadAllowed: e.target.value === 'true' })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050608] border border-[#20131A] text-white focus:outline-none focus:border-[#FF003C]"
              >
                <option value="true">Permit Downloads by default</option>
                <option value="false">Preview Only (Disable downloads by default)</option>
              </select>
            </div>
          </div>

          {/* Visible categories in public portfolio */}
          <div className="pt-2">
            <label className="block font-medium text-slate-300 mb-2">
              Featured Categories on Public Portfolio
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_CATEGORY_OPTIONS.map((cat) => {
                const isSelected = (settings.visibleCategories || []).includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategoryVisibility(cat)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#FF003C]/20 border-[#FF003C] text-[#FF4D6D] shadow-[0_0_12px_rgba(255,0,60,0.3)]'
                        : 'bg-[#050608] border-[#20131A] text-slate-400 hover:text-white'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '} {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#FF003C] to-[#C9002E] hover:from-[#FF1E46] hover:to-[#FF003C] text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(255,0,60,0.5)] transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-white" />
            <span>{isSaving ? 'Saving...' : 'Save Vault Settings'}</span>
          </button>
        </div>
      </form>

      {/* Metadata Backup & Export Section */}
      <div className="vault-panel rounded-2xl p-6 space-y-4 text-xs border border-[#20131A]">
        <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-[#1C1217] pb-3">
          <Database className="w-4 h-4 text-[#FF003C]" />
          <span>Data Persistence & Metadata Backup</span>
        </h3>

        <p className="text-slate-400 leading-relaxed max-w-xl">
          All your uploaded files are stored in persistent object storage on disk (up to 500MB quota). You can download an immutable JSON archive of all your file metadata, folder hierarchies, category tags, and settings.
        </p>

        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={handleExportBackup}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#1C1217] hover:bg-[#2A1620] text-[#FF4D6D] border border-[#FF003C]/30 font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Metadata Backup (.json)</span>
          </button>
        </div>
      </div>

      {/* Security: Change Master Password */}
      <div className="vault-panel rounded-2xl p-6 space-y-4 text-xs border border-[#20131A]">
        <h3 className="text-sm font-black text-white flex items-center gap-2 border-b border-[#1C1217] pb-3">
          <Key className="w-4 h-4 text-[#FF003C]" />
          <span>Security & Master Password</span>
        </h3>

        {passwordSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs">
            {passwordSuccess}
          </div>
        )}

        {passwordError && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs">
            {passwordError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block font-medium text-slate-300 mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#050608] border border-[#20131A] text-white focus:outline-none focus:border-[#FF003C]"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1.5">
              New Password (min 8 chars)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#050608] border border-[#20131A] text-white focus:outline-none focus:border-[#FF003C]"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#050608] border border-[#20131A] text-white focus:outline-none focus:border-[#FF003C]"
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="px-5 py-2.5 rounded-xl bg-[#1C1217] hover:bg-[#2A1620] text-white font-semibold transition-colors cursor-pointer disabled:opacity-50 border border-[#331018] hover:border-[#FF003C]"
          >
            {isChangingPassword ? 'Updating...' : 'Update Master Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
