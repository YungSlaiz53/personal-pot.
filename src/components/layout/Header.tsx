import React, { useState } from 'react';
import {
  Shield,
  Upload,
  Globe,
  LogOut,
  Menu,
  X,
  Share2,
  Check,
  Link as LinkIcon,
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenUpload: () => void;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
  onOpenPhotoModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUpload,
  onToggleSidebar,
  sidebarOpen
}) => {
  const {
    isAuthenticated,
    isPublicMode,
    setIsPublicMode,
    setActiveView,
    logout,
    user
  } = useAuth();

  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedAdmin, setCopiedAdmin] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const getPublicUrl = () => {
    return window.location.origin + '/';
  };

  const getAdminUrl = () => {
    return window.location.origin + '/?view=admin';
  };

  const handleCopyPublic = () => {
    navigator.clipboard.writeText(getPublicUrl());
    setCopiedPublic(true);
    setTimeout(() => setCopiedPublic(false), 2000);
  };

  const handleCopyAdmin = () => {
    navigator.clipboard.writeText(getAdminUrl());
    setCopiedAdmin(true);
    setTimeout(() => setCopiedAdmin(false), 2000);
  };

  // If in public mode and NOT logged in as admin:
  // Render an ultra-clean minimal header with ZERO admin buttons or sign-in links!
  if (isPublicMode && !isAuthenticated) {
    return (
      <header className="sticky top-0 z-30 h-16 bg-[#050608]/95 backdrop-blur-md border-b border-[#20131A] px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#1C0A10] border border-[#FF003C]/40 text-[#FF003C] flex items-center justify-center font-bold shadow-[0_0_15px_rgba(255,0,60,0.4)]">
            <Shield className="w-4 h-4 text-[#FF003C] stroke-[2.5]" />
          </div>
          <span className="font-black text-base tracking-tight text-white">
            BLESSED DAVID OGLEKWU
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FF003C] animate-ping" />
          <span>Digital Portfolio & Vault · Nigeria</span>
        </div>
      </header>
    );
  }

  // If in public mode but authenticated:
  if (isPublicMode && isAuthenticated) {
    return (
      <header className="sticky top-0 z-30 h-14 bg-[#080A0E] border-b border-[#FF003C]/30 px-4 sm:px-6 flex items-center justify-between shadow-[0_0_20px_rgba(255,0,60,0.15)]">
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Viewing Public Portfolio as:</span>
          <span className="text-xs font-bold text-[#FF4D6D]">{user?.name || 'Administrator'}</span>
        </div>
        <button
          onClick={() => {
            setIsPublicMode(false);
            setActiveView('overview');
          }}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FF003C] to-[#C9002E] hover:from-[#FF1E46] hover:to-[#FF003C] text-white font-bold text-xs shadow-[0_0_15px_rgba(255,0,60,0.4)] transition-all cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Return to Admin Console</span>
        </button>
      </header>
    );
  }

  // Admin Dashboard Header
  return (
    <header className="sticky top-0 z-30 h-16 bg-[#050608]/95 backdrop-blur-md border-b border-[#20131A] px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Brand */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-[#121622] rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div
          onClick={() => {
            setIsPublicMode(false);
            setActiveView('overview');
          }}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-[#1C0A10] border border-[#FF003C]/40 text-[#FF003C] flex items-center justify-center font-bold shadow-[0_0_15px_rgba(255,0,60,0.4)] transition-transform group-hover:scale-105">
            <Shield className="w-5 h-5 text-[#FF003C] stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#F8FAFC]">
                BLESSED DAVID OGLEKWU
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF003C]" />
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Vault Manager
            </span>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Share Links Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowShareMenu((prev) => !prev)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#0B0E14] hover:bg-[#151A24] border border-[#20131A] text-slate-300 text-xs font-semibold transition-colors"
          >
            <Share2 className="w-3.5 h-3.5 text-[#FF003C]" />
            <span className="hidden sm:inline">Vault Links</span>
          </button>

          {showShareMenu && (
            <div
              className="absolute right-0 mt-2 w-72 bg-[#080A0E] border border-[#2A141D] rounded-2xl shadow-2xl p-3 z-50 text-xs space-y-2 animate-in fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="font-bold text-slate-300 px-1 text-[11px] uppercase tracking-wider">
                Share & Access Links
              </div>

              {/* Public link copy */}
              <div className="p-2.5 rounded-xl bg-[#050608] border border-[#20131A] space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <Globe className="w-3 h-3" /> Public Link (Visitors & Employers)
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  {getPublicUrl()}
                </div>
                <button
                  onClick={handleCopyPublic}
                  className="w-full flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-[#141822] hover:bg-[#1E2538] text-white text-[11px] font-semibold transition-colors"
                >
                  {copiedPublic ? <Check className="w-3 h-3 text-emerald-400" /> : <LinkIcon className="w-3 h-3" />}
                  <span>{copiedPublic ? 'Public Link Copied!' : 'Copy Public Link'}</span>
                </button>
              </div>

              {/* Admin link copy */}
              <div className="p-2.5 rounded-xl bg-[#050608] border border-[#20131A] space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1 text-[#FF4D6D] font-semibold">
                    <Shield className="w-3 h-3" /> Private Admin Link (Secret)
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">
                  {getAdminUrl()}
                </div>
                <button
                  onClick={handleCopyAdmin}
                  className="w-full flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-[#1C0A10] hover:bg-[#280F18] text-[#FF4D6D] text-[11px] font-semibold transition-colors border border-[#FF003C]/30"
                >
                  {copiedAdmin ? <Check className="w-3 h-3 text-emerald-400" /> : <LinkIcon className="w-3 h-3" />}
                  <span>{copiedAdmin ? 'Admin Link Copied!' : 'Copy Admin Link'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview Public Portfolio */}
        <button
          onClick={() => setIsPublicMode(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#0B0E14] hover:bg-[#151A24] border border-[#20131A] text-slate-300 text-xs font-semibold transition-colors"
          title="Preview public visitor view"
        >
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">View Public</span>
        </button>

        {/* Upload Action */}
        <button
          onClick={onOpenUpload}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-gradient-to-r from-[#FF003C] to-[#C9002E] hover:from-[#FF1E46] hover:to-[#FF003C] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-[0_0_20px_rgba(255,0,60,0.45)] cursor-pointer"
        >
          <Upload className="w-4 h-4 text-white" />
          <span className="hidden sm:inline">Upload Files</span>
          <span className="sm:hidden">Upload</span>
        </button>

        {/* Logout Button */}
        <div className="flex items-center space-x-2 pl-2 border-l border-[#20131A]">
          <button
            onClick={logout}
            title="Sign out of admin console"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
