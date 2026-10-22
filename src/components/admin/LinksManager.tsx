import React, { useState, useRef } from 'react';
import {
  Link2,
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  Globe,
  Lock,
  Tag,
  Search,
  X,
  AlertCircle,
  Eye,
  Check,
  Upload,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { VaultLink } from '../../types/vault';
import { api } from '../../services/api';
import { formatDate } from '../../utils/formatters';

interface LinksManagerProps {
  links: VaultLink[];
  onLinksChanged: () => void;
}

const LINK_CATEGORIES = [
  'Web Development',
  'Graphic Design',
  'Video Projects',
  'Documents',
  'Certificates',
  'CV and Resume',
  'Personal Projects',
  'Resources and Links',
  'Other'
];

export const LinksManager: React.FC<LinksManagerProps> = ({ links, onLinksChanged }) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<VaultLink | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(LINK_CATEGORIES[0]);
  const [tagsInput, setTagsInput] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [showOnHome, setShowOnHome] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Thumbnail upload states
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const [deleteConfirmLink, setDeleteConfirmLink] = useState<VaultLink | null>(null);

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setDescription('');
    setCategory(LINK_CATEGORIES[0]);
    setTagsInput('');
    setThumbnailUrl('');
    setVisibility('public');
    setShowOnHome(false);
    setError(null);
    setEditingLink(null);
    setIsModalOpen(false);
    setIsUploadingThumbnail(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (link: VaultLink) => {
    setEditingLink(link);
    setTitle(link.title);
    setUrl(link.url);
    setDescription(link.description);
    setCategory(link.category);
    setTagsInput((link.tags || []).join(', '));
    setThumbnailUrl(link.thumbnailUrl || '');
    setVisibility(link.visibility);
    setShowOnHome(Boolean(link.showOnHome));
    setError(null);
    setIsModalOpen(true);
    setIsUploadingThumbnail(false);
  };

  const handleToggleHome = async (e: React.MouseEvent, link: VaultLink) => {
    e.stopPropagation();
    try {
      const nextVal = !link.showOnHome;
      await api.admin.updateLink(link.id, { showOnHome: nextVal });
      onLinksChanged();
    } catch (err) {
      console.error('Failed to toggle link home status:', err);
    }
  };

  const handleThumbnailFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, SVG, WebP) for the thumbnail.');
      return;
    }

    setIsUploadingThumbnail(true);
    setError(null);
    try {
      const res = await api.admin.uploadLinkThumbnail(file);
      setThumbnailUrl(res.url);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to upload thumbnail image');
      }
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      setError('Title and URL are required.');
      return;
    }

    // Basic URL validation
    let validUrl = url.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    try {
      const parsedTags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);

      if (editingLink) {
        await api.admin.updateLink(editingLink.id, {
          title,
          url: validUrl,
          description,
          category,
          tags: parsedTags,
          thumbnailUrl,
          visibility,
          showOnHome
        });
      } else {
        await api.admin.createLink({
          title,
          url: validUrl,
          description,
          category,
          tags: parsedTags,
          thumbnailUrl,
          visibility,
          showOnHome
        });
      }
      resetForm();
      onLinksChanged();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save link');
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmLink) return;
    try {
      await api.admin.deleteLink(deleteConfirmLink.id);
      setDeleteConfirmLink(null);
      onLinksChanged();
    } catch (err) {
      console.error('Failed to delete link', err);
    }
  };

  const filteredLinks = links.filter((link) => {
    if (categoryFilter !== 'All' && link.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = link.title.toLowerCase().includes(q);
      const matchUrl = link.url.toLowerCase().includes(q);
      const matchDesc = link.description.toLowerCase().includes(q);
      const matchTags = (link.tags || []).some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchUrl && !matchDesc && !matchTags) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="vault-panel rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[#F5C518]" />
            <span>External Links & Project Repositories</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Upload and store live project links, GitHub code repositories, live sites, and project thumbnails.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF003C] to-[#C9002E] hover:from-[#FF1E46] hover:to-[#FF003C] text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(255,0,60,0.45)] transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Add External Link</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="vault-panel rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border border-[#20131A]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search links by title, URL, description, or tags..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#050608] border border-[#20131A] text-white placeholder-slate-500 focus:outline-none focus:border-[#FF003C]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-[#FF4D6D] bg-[#1C0A10] px-2.5 py-1 rounded-md border border-[#FF003C]/30 font-semibold shadow-[0_0_10px_rgba(255,0,60,0.2)]">
            ⚡ Double-click to edit link
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#0E121A] border border-[#232A3B] text-slate-300 focus:outline-none focus:border-[#F5C518]"
          >
            <option value="All">All Categories</option>
            {LINK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Links Grid */}
      {filteredLinks.length === 0 ? (
        <div className="vault-panel rounded-2xl p-12 text-center text-slate-500 text-xs">
          No external links found. Click "Add External Link" to store your GitHub repositories, live demos, or portfolio resources with thumbnails.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLinks.map((link) => (
            <div
              key={link.id}
              onDoubleClick={() => handleOpenEdit(link)}
              title="Double-click to edit link"
              className="vault-panel vault-panel-hover rounded-2xl p-5 flex flex-col justify-between transition-all group cursor-pointer overflow-hidden"
            >
              <div>
                {/* Thumbnail Preview if present */}
                {link.thumbnailUrl && (
                  <div className="relative h-36 w-full rounded-xl overflow-hidden mb-3.5 border border-[#232A3B] bg-[#0E121A]">
                    <img
                      src={link.thumbnailUrl}
                      alt={link.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#1B212D] text-slate-300 border border-[#2B3548]">
                      {link.category}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleToggleHome(e, link)}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        link.showOnHome
                          ? 'bg-[#FF003C]/20 text-[#FF4D6D] border border-[#FF003C]/50 hover:bg-[#FF003C] hover:text-white shadow-[0_0_8px_rgba(255,0,60,0.3)]'
                          : 'bg-[#121620] text-slate-400 border border-[#232A3B] hover:text-slate-200'
                      }`}
                      title={link.showOnHome ? 'Shown on Home Screen (Click to hide)' : 'Vault Only (Click to show on Home Screen)'}
                    >
                      <Globe className="w-2.5 h-2.5" />
                      <span>{link.showOnHome ? 'Home: ON' : 'Home: OFF'}</span>
                    </button>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                        link.visibility === 'public'
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : 'text-purple-400 bg-purple-500/10'
                      }`}
                    >
                      {link.visibility}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(link)}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1E2533]"
                      title="Edit link"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmLink(link)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10"
                      title="Delete link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <h3 className="text-sm font-bold text-slate-100 group-hover:text-[#F5C518] transition-colors mb-1">
                  {link.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                  {link.description || 'No description provided.'}
                </p>

                {/* Tags */}
                {link.tags && link.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {link.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.2 rounded bg-[#0E121A] text-slate-400 border border-[#1E2533]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-[#1E2533] flex items-center justify-between text-xs">
                <span className="text-[11px] font-mono text-slate-500">
                  {link.clicksCount || 0} visits
                </span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center space-x-1 text-xs font-semibold text-[#F5C518] hover:underline"
                >
                  <span className="truncate max-w-[140px]">{link.url.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Link Modal with Thumbnail Upload */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className="w-full max-w-lg bg-[#141821] border border-[#232A3B] rounded-2xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E2533]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#F5C518]" />
                <span>{editingLink ? 'Edit Link' : 'Add External Link'}</span>
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
                <label className="block font-medium text-slate-300 mb-1.5">Link Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. HyperVault Core Engine (GitHub)"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white focus:outline-none focus:border-[#F5C518]"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Destination URL *</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white focus:outline-none focus:border-[#F5C518]"
                />
              </div>

              {/* Thumbnail Upload Section */}
              <div className="p-3.5 rounded-xl bg-[#0E121A] border border-[#1E2533] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-200 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#F5C518]" />
                    <span>Link Thumbnail Image</span>
                  </label>
                  {thumbnailUrl && (
                    <button
                      type="button"
                      onClick={() => setThumbnailUrl('')}
                      className="text-red-400 hover:underline text-[11px]"
                    >
                      Remove Thumbnail
                    </button>
                  )}
                </div>

                {/* If thumbnail is set: show preview */}
                {thumbnailUrl ? (
                  <div className="relative h-32 w-full rounded-xl overflow-hidden border border-[#232A3B] group">
                    <img
                      src={thumbnailUrl}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => thumbnailInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-[#F5C518] text-black font-semibold text-xs shadow-md"
                      >
                        Change Image
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Upload Dropzone / Button */
                  <div
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="border-2 border-dashed border-[#232A3B] hover:border-[#F5C518]/50 rounded-xl p-4 text-center cursor-pointer transition-colors bg-[#141821]/50"
                  >
                    {isUploadingThumbnail ? (
                      <div className="flex flex-col items-center py-2 text-slate-400 space-y-2">
                        <Loader2 className="w-5 h-5 animate-spin text-[#F5C518]" />
                        <span className="text-xs">Uploading thumbnail to vault storage...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-1">
                        <Upload className="w-6 h-6 text-[#F5C518] mb-1.5" />
                        <p className="font-semibold text-slate-200 text-xs">
                          Upload Thumbnail Image from Device
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Click to browse (PNG, JPG, SVG, WebP)
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailFileSelect}
                  className="hidden"
                />

                {/* Alternative: URL input */}
                <div>
                  <input
                    type="text"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="Or paste external thumbnail image URL..."
                    className="w-full px-3 py-1.5 rounded-lg bg-[#141821] border border-[#232A3B] text-slate-300 placeholder-slate-600 text-[11px] focus:outline-none focus:border-[#F5C518]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white focus:outline-none focus:border-[#F5C518]"
                  >
                    {LINK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">Visibility</label>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white focus:outline-none focus:border-[#FF003C]"
                  >
                    <option value="public">Public Portfolio</option>
                    <option value="private">Private Vault Only</option>
                  </select>
                </div>
              </div>

              {/* Show on Home Screen Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#080A0E] border border-[#20131A]">
                <div>
                  <span className="text-white font-bold text-xs flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#FF003C]" />
                    <span>Show on Home Screen</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Feature this repository / link on your public home screen.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={showOnHome}
                    onChange={(e) => setShowOnHome(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#20131A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF003C]"></div>
                </label>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="GitHub, OpenSource, Demo"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white focus:outline-none focus:border-[#FF003C]"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="What is this repository or project link?"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0E121A] border border-[#232A3B] text-white focus:outline-none focus:border-[#FF003C]"
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
                  disabled={isUploadingThumbnail}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#FF003C] to-[#C9002E] hover:from-[#FF1E46] hover:to-[#FF003C] text-white font-bold text-xs uppercase tracking-wider rounded-xl disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(255,0,60,0.45)]"
                >
                  {editingLink ? 'Update Link' : 'Add Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#141821] border border-[#232A3B] rounded-2xl p-6 shadow-2xl text-center">
            <h3 className="text-base font-bold text-white mb-2">Delete Link?</h3>
            <p className="text-xs text-slate-400 mb-6">
              Are you sure you want to delete "{deleteConfirmLink.title}"?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirmLink(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#232A3B] text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold"
              >
                Delete Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
