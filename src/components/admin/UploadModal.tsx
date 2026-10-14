import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  File,
  CheckCircle2,
  AlertCircle,
  Folder as FolderIcon,
  Globe,
  Lock,
  Tag,
  Loader2,
  FileText,
  Image,
  Video
} from 'lucide-react';
import { VaultFolder, VaultFile } from '../../types/vault';
import { api } from '../../services/api';
import { formatBytes } from '../../utils/formatters';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: VaultFolder[];
  defaultCategory?: string;
  defaultFolderId?: string | null;
  onUploadComplete: (newFiles: VaultFile[]) => void;
}

const CATEGORIES = [
  'Documents',
  'CV and Resume',
  'Web Development',
  'Graphic Design',
  'Video Projects',
  'Certificates',
  'Social Media Marketing',
  'Personal Projects',
  'Resources and Links',
  'Other'
];

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  folders,
  defaultCategory = 'Documents',
  defaultFolderId = null,
  onUploadComplete
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [folderId, setFolderId] = useState<string | null>(defaultFolderId);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [downloadAllowed, setDownloadAllowed] = useState(true);
  const [tagsInput, setTagsInput] = useState('');
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
      if (filesArray.length === 1 && !title) {
        setTitle(filesArray[0].name.replace(/\.[^/.]+$/, ''));
      }
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      setSelectedFiles(filesArray);
      if (filesArray.length === 1 && !title) {
        setTitle(filesArray[0].name.replace(/\.[^/.]+$/, ''));
      }
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError('Please select at least one file to upload.');
      return;
    }

    // Check size limit: 500MB per file
    const oversized = selectedFiles.some((f) => f.size > 500 * 1024 * 1024);
    if (oversized) {
      setError('One or more files exceed the 500MB single-file limit.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setError(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      formData.append('category', category);
      formData.append('folderId', folderId || '');
      formData.append('visibility', visibility);
      formData.append('downloadAllowed', String(downloadAllowed));
      formData.append('title', title);
      formData.append('description', description);

      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      formData.append('tags', JSON.stringify(parsedTags));

      const res = await api.admin.uploadFiles(formData, (percent) => {
        setUploadProgress(percent);
      });

      onUploadComplete(res.files);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Upload failed. Please check network or file format.');
      }
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#141821] border border-[#232A3B] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2533] bg-[#0E121A]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F5C518]/10 text-[#F5C518] flex items-center justify-center font-bold">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Upload to Vault</h2>
              <p className="text-[11px] text-slate-400">
                Persistent storage with configurable public/private access policy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 text-slate-400 hover:text-white hover:bg-[#1E2533] rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag and Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-[#FF003C] bg-[#FF003C]/10 scale-[0.99]'
                : 'border-[#20131A] hover:border-[#FF003C] bg-[#050608]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-[#1C0A10] border border-[#FF003C]/40 text-[#FF003C] flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(255,0,60,0.35)]">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-200">
              Drag & drop files here, or <span className="text-[#FF4D6D] underline hover:text-[#FF003C] transition-colors">browse files</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports Documents, PDFs, Images, SVGs, Videos, ZIPs, Code up to 500MB
            </p>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Selected Files ({selectedFiles.length})</span>
                <span>
                  Total: {formatBytes(selectedFiles.reduce((acc, f) => acc + f.size, 0))}
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-[#0E121A] rounded-xl border border-[#1E2533]">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-1.5 bg-[#141821] rounded-lg text-xs"
                  >
                    <div className="flex items-center space-x-2 min-w-0 pr-2">
                      <File className="w-3.5 h-3.5 text-[#F5C518] shrink-0" />
                      <span className="text-slate-200 truncate">{file.name}</span>
                      <span className="text-slate-500 font-mono text-[10px] shrink-0">
                        ({formatBytes(file.size)})
                      </span>
                    </div>
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="text-slate-500 hover:text-red-400 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Display Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={selectedFiles.length === 1 ? 'e.g. Verified Cloud Architect CV' : 'Uses filenames'}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#F5C518]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white text-xs focus:outline-none focus:border-[#F5C518]"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Folder</label>
              <select
                value={folderId || ''}
                onChange={(e) => setFolderId(e.target.value || null)}
                className="w-full px-3.5 py-2 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white text-xs focus:outline-none focus:border-[#F5C518]"
              >
                <option value="">Root / Unassigned</option>
                {folders.map((fld) => (
                  <option key={fld.id} value={fld.id}>
                    📁 {fld.name} ({fld.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. Design, UI, 2026"
                className="w-full px-3.5 py-2 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#F5C518]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief summary or technical context of this work item..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#F5C518]"
            />
          </div>

          {/* Access Policy Controls */}
          <div className="p-4 rounded-xl bg-[#0E121A] border border-[#1E2533] space-y-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Access & Visibility Controls
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Public vs Private */}
              <div
                onClick={() => setVisibility('public')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  visibility === 'public'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#141821] border-[#232A3B] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2 font-medium text-xs mb-1">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Public Portfolio</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Visible to employers and visitors on your shareable link.
                </p>
              </div>

              <div
                onClick={() => setVisibility('private')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  visibility === 'private'
                    ? 'bg-purple-500/10 border-purple-500/40 text-purple-300'
                    : 'bg-[#141821] border-[#232A3B] text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2 font-medium text-xs mb-1">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <span>Private Vault Only</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Visible only to you when logged into the admin dashboard.
                </p>
              </div>
            </div>

            {/* Download Policy */}
            <div className="flex items-center justify-between pt-2 border-t border-[#1E2533] text-xs">
              <div>
                <span className="text-slate-200 font-medium block">Allow Visitor Downloads</span>
                <span className="text-[10px] text-slate-400">
                  If disabled, visitors can only view/read the file in browser.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={downloadAllowed}
                  onChange={(e) => setDownloadAllowed(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#20131A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF003C]"></div>
              </label>
            </div>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 p-3 rounded-xl bg-[#0B0E14] border border-[#20131A]">
              <div className="flex justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF003C]" />
                  <span>Uploading {selectedFiles.length} item(s) to persistent storage...</span>
                </span>
                <span className="font-mono text-[#FF4D6D]">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-[#050608] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF003C] to-[#E60033] transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#20131A]">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-[#1E121A] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || selectedFiles.length === 0}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF003C] to-[#C9002E] hover:from-[#FF1E46] hover:to-[#FF003C] text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,0,60,0.45)] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 text-white" />
                  <span>Commit to Vault</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
