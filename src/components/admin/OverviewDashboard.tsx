import React from 'react';
import {
  Files,
  FolderTree,
  HardDrive,
  Globe,
  Lock,
  Upload,
  FolderPlus,
  Link2,
  ArrowUpRight,
  Clock,
  Sparkles,
  PieChart,
  Eye,
  Download
} from 'lucide-react';
import { VaultOverviewStats, VaultFile } from '../../types/vault';
import { formatBytes, formatTimeAgo, getCategoryBadgeColor } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

interface OverviewDashboardProps {
  stats: VaultOverviewStats | null;
  onOpenUpload: () => void;
  onOpenCreateFolder: () => void;
  onOpenCreateLink: () => void;
  onSelectFile: (file: VaultFile) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  stats,
  onOpenUpload,
  onOpenCreateFolder,
  onOpenCreateLink,
  onSelectFile
}) => {
  const { setActiveView, setIsPublicMode } = useAuth();

  if (!stats) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="w-8 h-8 border-2 border-[#F5C518] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Total Files',
      value: stats.totalFiles,
      subtitle: `${stats.recentUploads.length} uploaded recently`,
      icon: Files,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      action: () => setActiveView('all-files')
    },
    {
      title: 'Folders Created',
      value: stats.totalFolders,
      subtitle: 'Organized categories',
      icon: FolderTree,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      action: () => setActiveView('folders')
    },
    {
      title: 'Vault Storage Used',
      value: formatBytes(stats.totalStorage),
      subtitle: '500 MB available quota',
      icon: HardDrive,
      color: 'text-[#FF003C]',
      bgColor: 'bg-[#FF003C]/10',
      borderColor: 'border-[#FF003C]/30',
      action: () => setActiveView('all-files')
    },
    {
      title: 'Public Portfolio Files',
      value: stats.publicFiles,
      subtitle: 'Visible to external visitors',
      icon: Globe,
      color: 'text-[#FF003C]',
      bgColor: 'bg-[#FF003C]/10',
      borderColor: 'border-[#FF003C]/30',
      action: () => setActiveView('public-portfolio')
    },
    {
      title: 'Private Vault Files',
      value: stats.privateFiles,
      subtitle: 'Confidential & Admin only',
      icon: Lock,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      action: () => setActiveView('private-files')
    },
    {
      title: 'External Links',
      value: stats.totalLinks,
      subtitle: 'GitHub & live projects',
      icon: Link2,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
      action: () => setActiveView('links')
    }
  ];

  const breakdownTypes = [
    { key: 'documents', label: 'Documents & PDFs', color: 'bg-blue-500' },
    { key: 'images', label: 'Images & Vectors', color: 'bg-pink-500' },
    { key: 'videos', label: 'Videos & Media', color: 'bg-[#FF003C]' },
    { key: 'archives', label: 'Archives & ZIPs', color: 'bg-[#FF4D6D]' },
    { key: 'other', label: 'Other Formats', color: 'bg-slate-500' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Header Banner - Authentic Neon Red & Obsidian Black */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#14060A] via-[#080A0E] to-[#0D0508] border border-[#2D121B] p-6 sm:p-8 shadow-[0_0_30px_rgba(255,0,60,0.18)]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FF003C]/10 border border-[#FF003C]/40 text-[#FF4D6D] text-xs font-semibold shadow-[0_0_15px_rgba(255,0,60,0.2)]">
              <Sparkles className="w-3.5 h-3.5 text-[#FF003C]" />
              <span>Vault Master Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight">
              BLESSED DAVID OGLEKWU — Vault Console
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Your central digital storage vault (500MB storage). Upload, categorize, manage visibility policies, and distribute your approved portfolio work.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenUpload}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF003C] to-[#C9002E] hover:from-[#FF1E46] hover:to-[#FF003C] text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(255,0,60,0.45)] transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4 text-white" />
              <span>Upload New File</span>
            </button>
            <button
              onClick={onOpenCreateFolder}
              className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-[#0B0E14] hover:bg-[#151A24] text-slate-200 border border-[#20131A] font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-[#FF003C]" />
              <span>New Folder</span>
            </button>
            <button
              onClick={onOpenCreateLink}
              className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-[#0B0E14] hover:bg-[#151A24] text-slate-200 border border-[#20131A] font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <Link2 className="w-4 h-4 text-cyan-400" />
              <span>Add Link</span>
            </button>
          </div>
        </div>

        {/* Ambient neon red background glow */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-[#FF003C]/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF1E46]/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.action}
              className="vault-panel vault-panel-hover rounded-2xl p-5 cursor-pointer transition-all duration-200 group relative"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div
                  className={`w-9 h-9 rounded-xl ${card.bgColor} ${card.borderColor} border flex items-center justify-center ${card.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline justify-between">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#F5F7FA] font-mono">
                  {card.value}
                </span>
                <ArrowUpRight className="w-4 h-4 text-slate-600 group-hover:text-[#F5C518] transition-colors" />
              </div>

              <p className="text-xs text-slate-400 mt-2">{card.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Storage Breakdown & Storage Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Storage Bar Breakdown */}
        <div className="vault-panel rounded-2xl p-6 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#F5F7FA] flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#FF003C]" />
                <span>Storage Allocation</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {formatBytes(stats.totalStorage)}
              </span>
            </div>

            {/* Visual stacked bar */}
            <div className="h-3 w-full bg-[#0E121A] rounded-full overflow-hidden flex mb-6">
              {breakdownTypes.map((t) => {
                const item = stats.breakdown[t.key] || { bytes: 0 };
                const pct = stats.totalStorage > 0 ? (item.bytes / stats.totalStorage) * 100 : 0;
                if (pct <= 0) return null;
                return (
                  <div
                    key={t.key}
                    style={{ width: `${pct}%` }}
                    className={`${t.color} h-full transition-all`}
                    title={`${t.label}: ${formatBytes(item.bytes)} (${pct.toFixed(0)}%)`}
                  />
                );
              })}
            </div>

            {/* Items list */}
            <div className="space-y-3">
              {breakdownTypes.map((t) => {
                const item = stats.breakdown[t.key] || { count: 0, bytes: 0 };
                return (
                  <div key={t.key} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${t.color}`} />
                      <span className="text-slate-300 font-medium">{t.label}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-slate-400 font-mono">
                      <span>{item.count} items</span>
                      <span className="text-slate-200">{formatBytes(item.bytes)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#1E2533] flex justify-between items-center text-xs">
            <span className="text-slate-400">Public Portfolio Link</span>
            <button
              onClick={() => setIsPublicMode(true)}
              className="text-[#FF4D6D] hover:text-[#FF003C] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View as Public Visitor</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Uploads */}
        <div className="vault-panel rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#F5F7FA] flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Recent Vault Activity</span>
            </h3>
            <button
              onClick={() => setActiveView('all-files')}
              className="text-xs text-[#F5C518] hover:underline font-medium"
            >
              View All Files ({stats.totalFiles})
            </button>
          </div>

          {stats.recentUploads.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No files in your vault yet. Click "Upload New File" to get started.
            </div>
          ) : (
            <div className="divide-y divide-[#1E2533]">
              {stats.recentUploads.map((file) => {
                const badge = getCategoryBadgeColor(file.category);
                return (
                  <div
                    key={file.id}
                    onClick={() => onSelectFile(file)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      onSelectFile(file);
                    }}
                    title="Click or double-click to preview"
                    className="py-3 flex items-center justify-between hover:bg-[#1A212D]/50 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0 pr-4">
                      <div className="w-9 h-9 rounded-xl bg-[#0E121A] border border-[#232A3B] flex items-center justify-center shrink-0 text-[#F5C518]">
                        <Files className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-200 truncate">
                          {file.title || file.originalName}
                        </h4>
                        <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-400">
                          <span
                            className={`px-1.5 py-0.2 rounded border text-[10px] ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {file.category}
                          </span>
                          <span>•</span>
                          <span className="font-mono">{formatBytes(file.size)}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(file.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          file.visibility === 'public'
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-amber-400 bg-amber-500/10'
                        }`}
                      >
                        {file.visibility}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectFile(file);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1E2533]"
                        title="Quick Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
