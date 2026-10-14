import React, { useState } from 'react';
import {
  FolderTree,
  FolderPlus,
  Folder,
  Edit2,
  Trash2,
  File,
  HardDrive,
  Calendar,
  X,
  AlertCircle,
  Check,
  ChevronRight
} from 'lucide-react';
import { VaultFolder, VaultFile } from '../../types/vault';
import { formatBytes, formatDate } from '../../utils/formatters';
import { api } from '../../services/api';

interface FolderManagerProps {
  folders: VaultFolder[];
  files: VaultFile[];
  onFoldersChanged: () => void;
  onOpenFolderFiles: (folderId: string) => void;
}

const PRESET_CATEGORIES = [
  'Graphic Design',
  'Web Development',
  'Social Media Marketing',
  'Video Projects',
  'Documents',
  'Certificates',
  'CV and Resume',
  'Personal Projects',
  'Resources and Links',
  'Other'
];

const PRESET_COLORS = [
  '#F5C518', // Gold
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#EF4444'  // Red
];

export const FolderManager: React.FC<FolderManagerProps> = ({
  folders,
  files,
  onFoldersChanged,
  onOpenFolderFiles
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingFolder, setEditingFolder] = useState<VaultFolder | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState(PRESET_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  // Delete modal
  const [deleteConfirmFolder, setDeleteConfirmFolder] = useState<VaultFolder | null>(null);

  const resetForm = () => {
    setName('');
    setCategory(PRESET_CATEGORIES[0]);
    setCustomCategory('');
    setDescription('');
    setColor(PRESET_COLORS[0]);
    setError(null);
    setIsCreating(false);
    setEditingFolder(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const handleOpenEdit = (fld: VaultFolder) => {
    setEditingFolder(fld);
    setName(fld.name);
    setCategory(PRESET_CATEGORIES.includes(fld.category) ? fld.category : 'Other');
    setCustomCategory(PRESET_CATEGORIES.includes(fld.category) ? '' : fld.category);
    setDescription(fld.description);
    setColor(fld.color);
    setIsCreating(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a folder name.');
      return;
    }

    const finalCategory = category === 'Other' && customCategory.trim() ? customCategory.trim() : category;

    try {
      if (editingFolder) {
        await api.admin.updateFolder(editingFolder.id, {
          name,
          category: finalCategory,
          description,
          color
        });
      } else {
        await api.admin.createFolder({
          name,
          category: finalCategory,
          description,
          color
        });
      }
      resetForm();
      onFoldersChanged();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save folder');
      }
    }
  };

  const handleDeleteFolder = async () => {
    if (!deleteConfirmFolder) return;
    try {
      await api.admin.deleteFolder(deleteConfirmFolder.id);
      setDeleteConfirmFolder(null);
      onFoldersChanged();
    } catch (err) {
      console.error('Failed to delete folder', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="vault-panel rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-[#F5C518]" />
            <span>Folder & Category Hierarchy</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Structure your assets into logical vaults. Deleting a folder never destroys your files — they are safely preserved in the root directory.
          </p>
          <div className="mt-2">
            <span className="text-[11px] text-[#F5C518] bg-[#F5C518]/10 px-2 py-0.5 rounded-md border border-[#F5C518]/30 font-medium inline-block">
              ⚡ Double-click any folder to edit it
            </span>
          </div>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF1E46] via-[#FF8A00] to-[#FFD000] hover:brightness-110 text-black font-bold text-xs sm:text-sm shadow-lg shadow-[#FF1E46]/20 transition-all cursor-pointer shrink-0"
        >
          <FolderPlus className="w-4 h-4 text-black" />
          <span>New Folder</span>
        </button>
      </div>

      {/* Folders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {folders.map((fld) => {
          const folderFiles = files.filter((f) => f.folderId === fld.id && !f.isDeleted);
          const totalBytes = folderFiles.reduce((acc, f) => acc + (f.size || 0), 0);

          return (
            <div
              key={fld.id}
              onDoubleClick={() => handleOpenEdit(fld)}
              title="Double-click to edit folder"
              className="vault-panel vault-panel-hover rounded-2xl p-5 flex flex-col justify-between transition-all group cursor-pointer"
            >
              <div>
                {/* Folder Header */}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105"
                    style={{ backgroundColor: `${fld.color}18`, color: fld.color, border: `1px solid ${fld.color}35` }}
                  >
                    <Folder className="w-5 h-5 fill-current" />
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(fld)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1E2533] transition-colors"
                      title="Edit folder"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmFolder(fld)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Delete folder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md inline-block mb-1"
                    style={{ backgroundColor: `${fld.color}15`, color: fld.color }}
                  >
                    {fld.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-[#F5C518] transition-colors">
                    {fld.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {fld.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Folder Stats & Action */}
              <div className="mt-5 pt-3 border-t border-[#1E2533] flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-3">
                  <span className="flex items-center gap-1 font-mono text-slate-300">
                    <File className="w-3.5 h-3.5 text-slate-500" />
                    {folderFiles.length} files
                  </span>
                  <span>•</span>
                  <span className="font-mono text-slate-400">{formatBytes(totalBytes)}</span>
                </div>

                <button
                  onClick={() => onOpenFolderFiles(fld.id)}
                  className="text-xs font-semibold text-[#F5C518] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Folder Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-[#141821] border border-[#232A3B] rounded-2xl p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E2533]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-[#F5C518]" />
                <span>{editingFolder ? 'Edit Folder' : 'Create New Folder'}</span>
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Folder Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Verified Credentials 2026"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white focus:outline-none focus:border-[#F5C518]"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white focus:outline-none focus:border-[#F5C518]"
                >
                  {PRESET_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {category === 'Other' && (
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">Custom Category Name</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white focus:outline-none focus:border-[#F5C518]"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Color Accent</label>
                <div className="flex items-center space-x-2.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
                        color === c ? 'scale-110 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="What is contained in this vault folder?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white focus:outline-none focus:border-[#F5C518]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#1E2533]">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#FF1E46] via-[#FF8A00] to-[#FFD000] hover:brightness-110 text-black font-bold rounded-xl cursor-pointer shadow-md shadow-[#FF1E46]/20"
                >
                  {editingFolder ? 'Update Folder' : 'Create Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#141821] border border-[#232A3B] rounded-2xl p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
              <FolderTree className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white text-center mb-2">Delete Folder?</h3>
            <p className="text-xs text-slate-400 text-center mb-6 leading-relaxed">
              Are you sure you want to remove "{deleteConfirmFolder.name}"?
              <br />
              <strong className="text-emerald-400 font-medium">Safe Deletion:</strong> None of your files will be deleted. Any items inside will simply be moved to your unassigned root directory.
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmFolder(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#232A3B] text-slate-300 hover:text-white text-xs font-semibold"
              >
                Keep Folder
              </button>
              <button
                type="button"
                onClick={handleDeleteFolder}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold shadow-lg shadow-red-500/20"
              >
                Delete Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
