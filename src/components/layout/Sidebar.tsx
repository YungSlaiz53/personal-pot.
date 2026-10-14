import React from 'react';
import {
  LayoutDashboard,
  FolderTree,
  Files,
  Trash2,
  Settings,
  Globe,
  HardDrive,
  LogOut,
  Mail,
  Link as LinkIcon
} from 'lucide-react';
import { useAuth, VaultNavView } from '../../context/AuthContext';
import { formatBytes } from '../../utils/formatters';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  storageUsed: number;
  totalFilesCount?: number;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  storageUsed,
  unreadCount = 0
}) => {
  const { activeView, setActiveView, isPublicMode, setIsPublicMode, logout } = useAuth();

  const navItems: { id: VaultNavView; label: string; icon: React.ElementType; badge?: string | number; badgeColor?: string }[] = [
    { id: 'overview', label: 'Vault Overview', icon: LayoutDashboard },
    { id: 'all-files', label: 'File Manager', icon: Files },
    { id: 'folders', label: 'Folder Hierarchy', icon: FolderTree },
    { id: 'links', label: 'Project Links', icon: LinkIcon },
    { id: 'messages', label: 'Messages', icon: Mail, badge: unreadCount > 0 ? unreadCount : undefined, badgeColor: 'bg-[#FF003C] text-white font-bold' },
    { id: 'trash', label: 'Trash Bin', icon: Trash2 },
    { id: 'settings', label: 'Vault Settings', icon: Settings },
    { id: 'public-portfolio', label: 'Public Portfolio', icon: Globe }
  ];

  const handleNavClick = (viewId: VaultNavView) => {
    if (viewId === 'public-portfolio') {
      setIsPublicMode(true);
    } else {
      setIsPublicMode(false);
      setActiveView(viewId);
    }
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  // 500MB quota reference for gauge visual
  const MAX_STORAGE = 500 * 1024 * 1024;
  const storagePercentage = Math.min(Math.round((storageUsed / MAX_STORAGE) * 100), 100);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/85 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-16 bottom-0 left-0 z-40 w-64 bg-[#080A0E] border-r border-[#20131A] flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            Vault Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isPublicMode ? item.id === 'public-portfolio' : activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-[#1C0A10] text-[#FF4D6D] border border-[#FF003C]/50 shadow-[0_0_15px_rgba(255,0,60,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-[#121622] hover:border hover:border-[#1E2538]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[#FF003C]' : 'text-slate-400 group-hover:text-[#FF003C]'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full ${
                      item.badgeColor || (isActive ? 'bg-[#FF003C]/30 text-[#FF4D6D]' : 'bg-[#141822] text-slate-400')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Section: Storage Meter & Logout */}
        <div className="p-4 border-t border-[#20131A] space-y-4 bg-[#050608]/90">
          {/* Storage Gauge */}
          <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#20131A]">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
              <span className="flex items-center gap-1.5 font-bold">
                <HardDrive className="w-3.5 h-3.5 text-[#FF003C]" /> Vault Storage
              </span>
              <span className="font-mono text-[11px] font-bold text-[#FF4D6D]">{formatBytes(storageUsed)}</span>
            </div>
            <div className="w-full h-1.5 bg-[#050608] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF003C] to-[#E60033] rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(255,0,60,0.6)]"
                style={{ width: `${Math.max(storagePercentage, 3)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1.5 font-medium">
              <span>{storagePercentage}% of quota used</span>
              <span className="text-slate-400 font-mono">500 MB max</span>
            </div>
          </div>

          {/* Logout Action */}
          <button
            onClick={logout}
            className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-[#FF003C] hover:bg-[#1C0A10] rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Vault</span>
          </button>
        </div>
      </aside>
    </>
  );
};
