import React, { useState } from 'react';
import {
  X,
  Download,
  Eye,
  Calendar,
  HardDrive,
  Tag,
  Folder as FolderIcon,
  Lock,
  Globe,
  Share2,
  Check,
  AlertCircle,
  FileText,
  FileCode,
  File
} from 'lucide-react';
import { VaultFile } from '../../types/vault';
import { formatBytes, formatDate, getCategoryBadgeColor } from '../../utils/formatters';

interface FilePreviewModalProps {
  file: VaultFile | null;
  onClose: () => void;
  isAdmin?: boolean;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, onClose, isAdmin = false }) => {
  const [copied, setCopied] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  if (!file) return null;

  const viewUrl = isAdmin
    ? `/api/admin/files/${file.id}/view`
    : `/api/public/files/${file.id}/view`;

  const downloadUrl = isAdmin
    ? `/api/admin/files/${file.id}/download`
    : `/api/public/files/${file.id}/download`;

  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');
  const isAudio = file.mimeType.startsWith('audio/');
  const isPdf = file.mimeType === 'application/pdf';
  const isText = file.mimeType.startsWith('text/') || file.mimeType.includes('json');

  const badgeColor = getCategoryBadgeColor(file.category);

  const canDownload = isAdmin || file.downloadAllowed;

  const handleCopyLink = () => {
    const shareableUrl = `${window.location.origin}/?file=${file.id}`;
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!canDownload) {
      setDownloadError('Downloads are disabled by the vault owner for this item.');
      return;
    }
    window.location.href = downloadUrl;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#141821] border border-[#232A3B] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2533] bg-[#0E121A]/80">
          <div className="flex items-center space-x-3 overflow-hidden">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${badgeColor.bg} ${badgeColor.text} ${badgeColor.border}`}
            >
              {file.category}
            </span>
            <h2 className="text-lg font-bold text-[#F5F7FA] truncate max-w-md sm:max-w-xl">
              {file.title || file.originalName}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyLink}
              title="Copy link"
              className="p-2 text-slate-400 hover:text-[#F5C518] hover:bg-[#1E2533] rounded-lg transition-colors flex items-center space-x-1.5 text-xs font-medium"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-[#1E2533] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
          {/* Main Visual Preview Area */}
          <div className="flex-1 bg-[#090B0F] min-h-[340px] sm:min-h-[460px] flex items-center justify-center p-4 relative overflow-hidden">
            {isImage ? (
              <img
                src={viewUrl}
                alt={file.title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
                loading="lazy"
              />
            ) : isVideo ? (
              <video
                src={viewUrl}
                controls
                autoPlay={false}
                className="max-h-[75vh] w-full rounded-lg shadow-lg bg-black"
              >
                Your browser does not support HTML5 video preview.
              </video>
            ) : isAudio ? (
              <div className="w-full max-w-md p-6 bg-[#141821] border border-[#232A3B] rounded-2xl flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#F5C518]/10 text-[#F5C518] flex items-center justify-center">
                  <Eye className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-white font-medium">{file.title}</h4>
                  <p className="text-xs text-slate-400">{file.originalName}</p>
                </div>
                <audio src={viewUrl} controls className="w-full mt-2" />
              </div>
            ) : isPdf ? (
              <div className="w-full h-full min-h-[500px] flex flex-col">
                <iframe
                  src={viewUrl}
                  title={file.title}
                  className="w-full h-[540px] rounded-lg border border-[#232A3B] bg-slate-900"
                />
              </div>
            ) : isText ? (
              <div className="w-full h-full min-h-[400px] flex flex-col p-4 bg-[#0B0D11] rounded-lg border border-[#232A3B] overflow-auto">
                <div className="flex items-center space-x-2 text-xs text-slate-400 mb-3 pb-2 border-b border-[#1E2533]">
                  <FileCode className="w-4 h-4 text-[#F5C518]" />
                  <span>Document Stream / Source Viewer</span>
                </div>
                <iframe
                  src={viewUrl}
                  title={file.title}
                  className="w-full h-[450px] bg-transparent text-slate-200 border-none font-mono text-sm"
                />
              </div>
            ) : (
              <div className="text-center p-8 max-w-md flex flex-col items-center">
                <div className="w-20 h-20 rounded-2xl bg-[#1E2533] border border-[#2B3548] flex items-center justify-center text-[#F5C518] mb-4">
                  <File className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{file.title}</h3>
                <p className="text-sm text-slate-400 mb-4">{file.originalName}</p>
                <p className="text-xs text-slate-500 mb-6">
                  This file format ({file.mimeType}) can be inspected directly on your device.
                </p>
                {canDownload && (
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#F5C518] text-black hover:bg-[#E5B407] rounded-xl font-semibold text-sm transition-all shadow-lg shadow-[#F5C518]/20"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download File ({formatBytes(file.size)})</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar: Details & Metadata */}
          <div className="w-full lg:w-80 bg-[#141821] border-t lg:border-t-0 lg:border-l border-[#1E2533] p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  File Details
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {file.description || 'No additional description provided for this vault item.'}
                </p>
              </div>

              {/* Meta Grid */}
              <div className="space-y-3 pt-3 border-t border-[#1E2533] text-xs">
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5" /> File Size
                  </span>
                  <span className="text-slate-200 font-medium">{formatBytes(file.size)}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Uploaded
                  </span>
                  <span className="text-slate-200">{formatDate(file.createdAt)}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    {file.visibility === 'public' ? (
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    Visibility
                  </span>
                  <span
                    className={`font-semibold capitalize ${
                      file.visibility === 'public' ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {file.visibility}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-400" /> Total Views
                  </span>
                  <span className="text-slate-200 font-mono">{file.viewsCount || 0}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5 text-indigo-400" /> Downloads
                  </span>
                  <span className="text-slate-200 font-mono">{file.downloadsCount || 0}</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Policy</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      file.downloadAllowed
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {file.downloadAllowed ? 'Download Permitted' : 'Preview Only'}
                  </span>
                </div>
              </div>

              {/* Tags */}
              {file.tags && file.tags.length > 0 && (
                <div className="pt-3 border-t border-[#1E2533]">
                  <span className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {file.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-[#1B212D] text-slate-300 border border-[#2B3548]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-[#1E2533] space-y-2">
              {downloadError && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{downloadError}</span>
                </div>
              )}

              {canDownload ? (
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-[#FF1E46] via-[#FF8A00] to-[#FFD000] hover:brightness-110 text-black font-bold rounded-xl text-sm transition-all shadow-md shadow-[#FF1E46]/20 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-black" />
                  <span>Download ({formatBytes(file.size)})</span>
                </button>
              ) : (
                <div className="w-full text-center p-3 rounded-xl bg-[#0D111A] border border-[#202738] text-xs text-slate-400">
                  <div className="flex items-center justify-center gap-1.5 text-[#FF1E46] font-medium mb-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Protected: Preview Only</span>
                  </div>
                  Direct download is restricted by vault settings.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
