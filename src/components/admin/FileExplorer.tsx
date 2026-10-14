import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Grid,
  List,
  ArrowUpDown,
  MoreVertical,
  Eye,
  Download,
  Edit2,
  Trash2,
  Globe,
  Lock,
  Tag,
  Folder as FolderIcon,
  CheckSquare,
  Square,
  AlertCircle,
  FileText,
  Image,
  Video,
  File,
  HardDrive,
  Calendar,
  X
} from 'lucide-react';
import { VaultFile, VaultFolder } from '../../types/vault';
import { formatBytes, formatDate, formatTimeAgo, getCategoryBadgeColor } from '../../utils/formatters';
import { api } from '../../services/api';

interface FileExplorerProps {
  files: VaultFile[];
  folders: VaultFolder[];
  activeCategoryFilter?: string;
  activeVisibilityFilter?: string;
  onPreviewFile: (file: VaultFile) => void;
  onFilesChanged: () => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  folders,
  activeCategoryFilter = 'All',
  activeVisibilityFilter = 'all',
  onPreviewFile,
  onFilesChanged
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(activeCategoryFilter);
  const [folderFilter, setFolderFilter] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState(activeVisibilityFilter);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Selected for batch actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Edit file drawer / modal
  const [editingFile, setEditingFile] = useState<VaultFile | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editFolderId, setEditFolderId] = useState<string | null>(null);
  const [editTags, setEditTags] = useState('');
  const [editVisibility, setEditVisibility] = useState<'public' | 'private'>('public');
  const [editDownloadAllowed, setEditDownloadAllowed] = useState(true);

  // Delete confirmation
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<VaultFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter & Sort
  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        // category
        if (categoryFilter !== 'All' && file.category !== categoryFilter) return false;
        // folder
        if (folderFilter !== 'all') {
          if (folderFilter === 'root' && file.folderId !== null) return false;
          if (folderFilter !== 'root' && file.folderId !== folderFilter) return false;
        }
        // visibility
        if (visibilityFilter !== 'all' && file.visibility !== visibilityFilter) return false;
        // type
        if (typeFilter !== 'all') {
          const mime = file.mimeType.toLowerCase();
          if (typeFilter === 'documents' && !mime.includes('pdf') && !mime.includes('doc') && !mime.includes('text')) return false;
          if (typeFilter === 'images' && !mime.startsWith('image/')) return false;
          if (typeFilter === 'videos' && !mime.startsWith('video/')) return false;
        }
        // search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (file.title || '').toLowerCase().includes(q);
          const matchName = (file.originalName || '').toLowerCase().includes(q);
          const matchDesc = (file.description || '').toLowerCase().includes(q);
          const matchTags = (file.tags || []).some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchName && !matchDesc && !matchTags) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          return sortOrder === 'desc' ? diff : -diff;
        }
        if (sortBy === 'name') {
          const diff = (a.title || a.originalName).localeCompare(b.title || b.originalName);
          return sortOrder === 'desc' ? -diff : diff;
        }
        if (sortBy === 'size') {
          const diff = (b.size || 0) - (a.size || 0);
          return sortOrder === 'desc' ? diff : -diff;
        }
        return 0;
      });
  }, [files, searchQuery, categoryFilter, folderFilter, visibilityFilter, typeFilter, sortBy, sortOrder]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredFiles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFiles.map((f) => f.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const openEditModal = (file: VaultFile) => {
    setEditingFile(file);
    setEditTitle(file.title || file.originalName);
    setEditDesc(file.description || '');
    setEditCategory(file.category);
    setEditFolderId(file.folderId);
    setEditTags((file.tags || []).join(', '));
    setEditVisibility(file.visibility);
    setEditDownloadAllowed(file.downloadAllowed);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFile) return;

    try {
      const parsedTags = editTags.split(',').map((t) => t.trim()).filter(Boolean);
      await api.admin.updateFile(editingFile.id, {
        title: editTitle,
        description: editDesc,
        category: editCategory,
        folderId: editFolderId,
        tags: parsedTags,
        visibility: editVisibility,
        downloadAllowed: editDownloadAllowed
      });
      setEditingFile(null);
      onFilesChanged();
    } catch (err) {
      console.error('Failed to update file:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmFile) return;
    setIsDeleting(true);
    try {
      await api.admin.deleteFile(deleteConfirmFile.id, false); // soft delete to trash
      setDeleteConfirmFile(null);
      onFilesChanged();
    } catch (err) {
      console.error('Failed to delete file:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Batch delete selected files
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Move ${selectedIds.size} selected items to Trash?`)) return;

    for (const id of Array.from(selectedIds)) {
      await api.admin.deleteFile(id, false).catch(() => {});
    }
    setSelectedIds(new Set());
    onFilesChanged();
  };

  // Batch toggle visibility
  const handleBatchVisibility = async (vis: 'public' | 'private') => {
    for (const id of Array.from(selectedIds)) {
      await api.admin.updateFile(id, { visibility: vis }).catch(() => {});
    }
    setSelectedIds(new Set());
    onFilesChanged();
  };

  const categoriesList = [
    'All',
    'Documents',
    'CV and Resume',
    'Web Development',
    'Graphic Design',
    'Video Projects',
    'Certificates',
    'Social Media Marketing',
    'Personal Projects',
    'Resources and Links'
  ];

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="vault-panel rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, original filename, tags, or description..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-[#F5C518]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Toggles & Sorting */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Sort Dropdown */}
            <div className="flex items-center space-x-1 bg-[#0E121A] border border-[#232A3B] rounded-xl px-2.5 py-1 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="date" className="bg-[#141821]">Upload Date</option>
                <option value="name" className="bg-[#141821]">Name</option>
                <option value="size" className="bg-[#141821]">File Size</option>
              </select>
              <button
                onClick={() => setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
                className="text-slate-400 hover:text-[#F5C518] px-1 font-mono text-[10px]"
                title="Toggle sort direction"
              >
                {sortOrder === 'desc' ? 'DESC' : 'ASC'}
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#0E121A] border border-[#232A3B] rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-[#1E2533] text-[#F5C518]' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-[#1E2533] text-[#F5C518]' : 'text-slate-400 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Chips Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1E2533] text-xs">
          <span className="text-slate-500 font-medium flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-[#0E121A] border border-[#232A3B] text-slate-300 focus:outline-none focus:border-[#F5C518]"
          >
            {categoriesList.map((c) => (
              <option key={c} value={c} className="bg-[#141821]">
                Category: {c}
              </option>
            ))}
          </select>

          {/* Folder Filter */}
          <select
            value={folderFilter}
            onChange={(e) => setFolderFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-[#0E121A] border border-[#232A3B] text-slate-300 focus:outline-none focus:border-[#F5C518]"
          >
            <option value="all" className="bg-[#141821]">Folder: All Folders</option>
            <option value="root" className="bg-[#141821]">Folder: Root / Unassigned</option>
            {folders.map((fld) => (
              <option key={fld.id} value={fld.id} className="bg-[#141821]">
                Folder: {fld.name}
              </option>
            ))}
          </select>

          {/* Visibility Filter */}
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-[#0E121A] border border-[#232A3B] text-slate-300 focus:outline-none focus:border-[#F5C518]"
          >
            <option value="all" className="bg-[#141821]">Visibility: All</option>
            <option value="public" className="bg-[#141821]">Visibility: Public Only</option>
            <option value="private" className="bg-[#141821]">Visibility: Private Only</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-[#0E121A] border border-[#232A3B] text-slate-300 focus:outline-none focus:border-[#F5C518]"
          >
            <option value="all" className="bg-[#141821]">Type: All Formats</option>
            <option value="documents" className="bg-[#141821]">Type: Documents & PDFs</option>
            <option value="images" className="bg-[#141821]">Type: Images & SVGs</option>
            <option value="videos" className="bg-[#141821]">Type: Videos & Clips</option>
          </select>

          <span className="text-[11px] text-[#FFD000] bg-[#FFD000]/15 px-2 py-0.5 rounded-md border border-[#FFD000]/35 font-medium">
            ⚡ Double-click any item to edit
          </span>

          {(categoryFilter !== 'All' || folderFilter !== 'all' || visibilityFilter !== 'all' || typeFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setCategoryFilter('All');
                setFolderFilter('all');
                setVisibilityFilter('all');
                setTypeFilter('all');
                setSearchQuery('');
              }}
              className="text-[#F5C518] hover:underline text-xs ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Batch Operations Bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#1B212D] border border-[#F5C518]/30 rounded-xl text-xs animate-in fade-in duration-150">
          <div className="flex items-center space-x-2 text-slate-200">
            <CheckSquare className="w-4 h-4 text-[#F5C518]" />
            <span className="font-semibold text-[#F5F7FA]">{selectedIds.size}</span> item(s) selected
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleBatchVisibility('public')}
              className="px-3 py-1.5 rounded-lg bg-[#0E121A] text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/30 font-medium transition-colors"
            >
              Make Public
            </button>
            <button
              onClick={() => handleBatchVisibility('private')}
              className="px-3 py-1.5 rounded-lg bg-[#0E121A] text-purple-400 hover:bg-purple-500/10 border border-purple-500/30 font-medium transition-colors"
            >
              Make Private
            </button>
            <button
              onClick={handleBatchDelete}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 font-medium transition-colors"
            >
              Move to Trash
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-400 hover:text-white px-2 py-1"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredFiles.length === 0 ? (
        <div className="vault-panel rounded-2xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-[#1E2533] border border-[#2B3548] flex items-center justify-center text-slate-500 mb-4">
            <File className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No matching files found</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            Try adjusting your search criteria, removing filters, or upload a new file.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => {
            const isSelected = selectedIds.has(file.id);
            const badge = getCategoryBadgeColor(file.category);
            const isImage = file.mimeType.startsWith('image/');
            const isVideo = file.mimeType.startsWith('video/');

            return (
              <div
                key={file.id}
                onClick={() => onPreviewFile(file)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  openEditModal(file);
                }}
                title="Click to preview • Double-click to edit"
                className={`vault-panel vault-panel-hover rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between transition-all duration-200 group ${
                  isSelected ? 'border-[#F5C518] ring-1 ring-[#F5C518]' : ''
                }`}
              >
                {/* Thumbnail / Header Area */}
                <div className="relative h-40 bg-[#0A0D13] border-b border-[#1E2533] flex items-center justify-center overflow-hidden">
                  {isImage ? (
                    <img
                      src={`/api/admin/files/${file.id}/view`}
                      alt={file.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : isVideo ? (
                    <div className="relative w-full h-full bg-[#111622] flex items-center justify-center">
                      <Video className="w-10 h-10 text-purple-400" />
                      <span className="absolute bottom-2 right-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/70 text-slate-300">
                        VIDEO
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <div className="w-12 h-12 rounded-xl bg-[#141821] border border-[#232A3B] flex items-center justify-center text-[#F5C518] mb-2 shadow-inner">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                      </span>
                    </div>
                  )}

                  {/* Top Overlay Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelect(file.id);
                      }}
                      className="p-1 rounded-md bg-black/60 backdrop-blur-xs text-white hover:text-[#F5C518] transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#F5C518]" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {/* Visibility Tag */}
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold backdrop-blur-md ${
                          file.visibility === 'public'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}
                      >
                        {file.visibility === 'public' ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {file.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {formatBytes(file.size)}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-[#F5C518] transition-colors line-clamp-1">
                      {file.title || file.originalName}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {file.description || file.originalName}
                    </p>
                  </div>

                  {/* Footer & Actions */}
                  <div className="pt-3 border-t border-[#1E2533] flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[11px]">{formatTimeAgo(file.createdAt)}</span>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(file);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-[#1E2533] rounded-lg transition-colors"
                        title="Edit File Metadata"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/api/admin/files/${file.id}/download`;
                        }}
                        className="p-1.5 text-slate-400 hover:text-[#F5C518] hover:bg-[#1E2533] rounded-lg transition-colors"
                        title="Download to device"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmFile(file);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Move to Trash"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="vault-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1E2533] bg-[#0E121A]/80 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredFiles.length && filteredFiles.length > 0}
                      onChange={toggleSelectAll}
                      className="cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5">Item Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Folder</th>
                  <th className="p-3.5">Size</th>
                  <th className="p-3.5">Visibility</th>
                  <th className="p-3.5">Uploaded</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2533]">
                {filteredFiles.map((file) => {
                  const isSelected = selectedIds.has(file.id);
                  const badge = getCategoryBadgeColor(file.category);
                  const folder = folders.find((f) => f.id === file.folderId);

                  return (
                    <tr
                      key={file.id}
                      onClick={() => onPreviewFile(file)}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        openEditModal(file);
                      }}
                      title="Click to preview • Double-click to edit"
                      className={`hover:bg-[#1A212D]/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#1E2533]/40' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(file.id)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="p-3.5 font-medium text-slate-200">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#0E121A] border border-[#232A3B] flex items-center justify-center text-[#F5C518] shrink-0">
                            <File className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-100 truncate max-w-xs">
                              {file.title || file.originalName}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-xs">
                              {file.originalName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded border text-[10px] ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {file.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400">
                        {folder ? (
                          <span className="flex items-center gap-1">
                            <FolderIcon className="w-3 h-3 text-[#F5C518]" />
                            {folder.name}
                          </span>
                        ) : (
                          <span className="text-slate-600">Root</span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">{formatBytes(file.size)}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            file.visibility === 'public'
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : 'text-purple-400 bg-purple-500/10'
                          }`}
                        >
                          {file.visibility}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400">{formatDate(file.createdAt)}</td>
                      <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => onPreviewFile(file)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1E2533]"
                            title="Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(file)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1E2533]"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              window.location.href = `/api/admin/files/${file.id}/download`;
                            }}
                            className="p-1.5 text-slate-400 hover:text-[#F5C518] rounded-lg hover:bg-[#1E2533]"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmFile(file)}
                            className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-[#141821] border border-[#232A3B] rounded-2xl p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E2533]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#F5C518]" />
                <span>Edit File Metadata</span>
              </h3>
              <button
                onClick={() => setEditingFile(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white focus:outline-none focus:border-[#F5C518]"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white focus:outline-none focus:border-[#F5C518]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white focus:outline-none focus:border-[#F5C518]"
                  >
                    {categoriesList.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">Folder</label>
                  <select
                    value={editFolderId || ''}
                    onChange={(e) => setEditFolderId(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white focus:outline-none focus:border-[#F5C518]"
                  >
                    <option value="">Root / Unassigned</option>
                    {folders.map((fld) => (
                      <option key={fld.id} value={fld.id}>
                        {fld.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white focus:outline-none focus:border-[#F5C518]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1E2533]">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Visibility</label>
                  <select
                    value={editVisibility}
                    onChange={(e) => setEditVisibility(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white focus:outline-none focus:border-[#F5C518]"
                  >
                    <option value="public">Public Portfolio</option>
                    <option value="private">Private Vault Only</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center space-x-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={editDownloadAllowed}
                      onChange={(e) => setEditDownloadAllowed(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-slate-300">Allow Visitor Downloads</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-[#1E2533]">
                <button
                  type="button"
                  onClick={() => setEditingFile(null)}
                  className="px-4 py-2 text-slate-400 hover:text-white rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-[#FF1E46] via-[#FF8A00] to-[#FFD000] hover:brightness-110 text-black font-bold rounded-xl cursor-pointer shadow-md shadow-[#FF1E46]/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#141821] border border-[#232A3B] rounded-2xl p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white text-center mb-2">
              Move File to Trash?
            </h3>
            <p className="text-xs text-slate-400 text-center mb-6 leading-relaxed">
              "{deleteConfirmFile.title || deleteConfirmFile.originalName}" will be removed from your active vault and public portfolio. You can restore it or permanently wipe it in the Trash view.
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmFile(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-[#232A3B] text-slate-300 hover:text-white hover:bg-[#1E2533] text-xs font-semibold"
              >
                Keep File
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold shadow-lg shadow-red-500/20 flex items-center justify-center space-x-1.5"
              >
                <span>Move to Trash</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
