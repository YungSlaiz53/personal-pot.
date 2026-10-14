import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  Search,
  Eye,
  Download,
  ExternalLink,
  Shield,
  Lock,
  Mail,
  MapPin,
  FileText,
  Video,
  Share2,
  ArrowUpRight,
  Github,
  Linkedin,
  Twitter,
  Files,
  Link as LinkIcon,
  Camera
} from 'lucide-react';
import {
  PublicPortfolioProfile,
  VaultFile,
  VaultLink
} from '../../types/vault';
import { api } from '../../services/api';
import { formatBytes, getCategoryBadgeColor } from '../../utils/formatters';
import { FilePreviewModal } from '../shared/FilePreviewModal';
import { ChangePhotoModal } from '../admin/ChangePhotoModal';
import { useAuth } from '../../context/AuthContext';

export const PublicPortfolio: React.FC = () => {
  const { isAuthenticated, enterAdminPortal } = useAuth();

  const [profile, setProfile] = useState<PublicPortfolioProfile | null>(null);
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [links, setLinks] = useState<VaultLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Invisible photo clicks counter to secretly unlock Admin Portal
  const [photoClicks, setPhotoClicks] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  // Photo editing modal state
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Quick search
  const [search, setSearch] = useState('');

  // Preview Modal
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);

  // Share feedback
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadPublicData() {
      try {
        const [profData, filesData, , linksData] = await Promise.all([
          api.public.getProfile(),
          api.public.getFiles(),
          api.public.getFolders(),
          api.public.getLinks()
        ]);
        setProfile(profData);
        setFiles(filesData);
        setLinks(linksData);
      } catch (err) {
        console.error('Failed to load public portfolio data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPublicData();
  }, []);

  // Handles photo interaction:
  // If already logged in as Admin -> opens Change Photo Modal!
  // If visitor -> invisible click counter that silently triggers Admin Portal on 3 clicks
  const handlePhotoClick = () => {
    if (isAuthenticated) {
      setIsPhotoModalOpen(true);
      return;
    }

    const now = Date.now();
    if (now - lastClickTime > 2500) {
      setPhotoClicks(1);
      setLastClickTime(now);
    } else {
      const nextCount = photoClicks + 1;
      setPhotoClicks(nextCount);
      setLastClickTime(now);

      if (nextCount >= 3) {
        setPhotoClicks(0);
        enterAdminPortal();
      }
    }
  };

  // Search filtered files
  const filteredFiles = useMemo(() => {
    if (!search.trim()) return files;
    const q = search.toLowerCase();
    return files.filter((file) => {
      const matchTitle = (file.title || '').toLowerCase().includes(q);
      const matchName = (file.originalName || '').toLowerCase().includes(q);
      const matchDesc = (file.description || '').toLowerCase().includes(q);
      const matchCategory = (file.category || '').toLowerCase().includes(q);
      const matchTags = (file.tags || []).some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchName || matchDesc || matchCategory || matchTags;
    });
  }, [files, search]);

  // Search filtered links
  const filteredLinks = useMemo(() => {
    if (!search.trim()) return links;
    const q = search.toLowerCase();
    return links.filter((link) => {
      const matchTitle = link.title.toLowerCase().includes(q);
      const matchDesc = link.description.toLowerCase().includes(q);
      const matchCategory = (link.category || '').toLowerCase().includes(q);
      const matchTags = (link.tags || []).some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchCategory || matchTags;
    });
  }, [links, search]);

  const handleSharePortfolio = () => {
    navigator.clipboard.writeText(window.location.origin + '/');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLinkClick = async (id: string, url: string) => {
    try {
      await api.public.trackLinkClick(id);
    } catch {
      // Non-blocking
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePhotoUpdated = (newUrl: string) => {
    if (profile) {
      setProfile({
        ...profile,
        avatarUrl: newUrl
      });
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-[#050608] flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#1C0A10] border border-[#FF003C]/40 flex items-center justify-center text-[#FF003C] shadow-[0_0_25px_rgba(255,0,60,0.4)]">
          <Shield className="w-6 h-6 animate-pulse text-[#FF003C]" />
        </div>
        <p className="text-sm font-bold text-white tracking-wider">Loading BLESSED DAVID OGLEKWU...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050608] text-[#F8FAFC] selection:bg-[#FF003C] selection:text-white">
      {/* Hero Header Section: Authentic Neon Red & Pitch Black */}
      <section className="relative border-b border-[#20131A] bg-gradient-to-b from-[#14060A] via-[#080A0E] to-[#050608] pt-12 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Authentic Ambient Neon Red Glow */}
        <div className="absolute top-0 left-1/3 -translate-x-1/2 w-96 h-96 bg-[#FF003C]/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 translate-x-1/2 w-80 h-80 bg-[#FF1E46]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Profile Photo (Secret 3-Click Trigger or Admin Edit) */}
            <div className="relative shrink-0 flex flex-col items-center">
              <div
                onClick={handlePhotoClick}
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl p-[2px] bg-gradient-to-tr from-[#FF003C] via-[#FF3B60] to-[#88001F] shadow-[0_0_35px_rgba(255,0,60,0.5)] cursor-pointer select-none transition-transform duration-300 hover:scale-[1.03] relative group"
                title={isAuthenticated ? 'Click to change photo' : 'Blessed David Oglekwu'}
              >
                <div className="w-full h-full rounded-[22px] overflow-hidden bg-[#080A0E]">
                  <img
                    src={profile.avatarUrl}
                    alt={profile.ownerName}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                </div>

                {/* If authenticated as Admin, show visible "Change Photo" action */}
                {isAuthenticated ? (
                  <div className="absolute inset-0 rounded-3xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-xs">
                    <Camera className="w-6 h-6 text-[#FF003C] mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                      Change Photo
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Explicit Edit Photo Button for Admin */}
              {isAuthenticated && (
                <button
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="mt-2.5 px-3 py-1 rounded-full bg-[#1C0A10] border border-[#FF003C]/40 text-[#FF4D6D] hover:text-white hover:bg-[#FF003C] hover:border-[#FF003C] text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(255,0,60,0.3)] cursor-pointer"
                >
                  <Camera className="w-3 h-3" />
                  <span>Change Photo</span>
                </button>
              )}
            </div>

            {/* Profile Information & Description */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#FF003C]/10 border border-[#FF003C]/40 text-xs font-semibold shadow-[0_0_15px_rgba(255,0,60,0.2)]">
                <span className="w-2 h-2 rounded-full bg-[#FF003C] animate-ping" />
                <span className="text-[#FF4D6D]">Verified Digital Vault & Portfolio</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white drop-shadow">
                BLESSED DAVID OGLEKWU
              </h1>

              <p className="text-sm sm:text-base font-bold text-[#FF003C] tracking-wide">
                {profile.ownerTitle}
              </p>

              {/* Description */}
              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                {profile.bio}
              </p>

              {/* Meta details */}
              <div className="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-semibold text-white">
                  <MapPin className="w-3.5 h-3.5 text-[#FF003C]" />
                  <span>{profile.location || 'Nigeria'}</span>
                </span>
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-1.5 hover:text-[#FF003C] transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{profile.email}</span>
                  </a>
                )}
              </div>

              {/* Social Links (Website button removed per user request) */}
              <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                {profile.socialLinks?.github && (
                  <a
                    href={profile.socialLinks.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#0B0E14] border border-[#20131A] text-slate-300 hover:text-white hover:border-[#FF003C] text-xs font-semibold transition-all shadow-sm"
                    title="GitHub"
                  >
                    <Github className="w-3.5 h-3.5 text-slate-300" />
                    <span>GitHub</span>
                  </a>
                )}
                {profile.socialLinks?.linkedin && (
                  <a
                    href={profile.socialLinks.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#0B0E14] border border-[#20131A] text-slate-300 hover:text-white hover:border-[#FF003C] text-xs font-semibold transition-all shadow-sm"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-3.5 h-3.5 text-slate-300" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {profile.socialLinks?.twitter && (
                  <a
                    href={profile.socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#0B0E14] border border-[#20131A] text-slate-300 hover:text-white hover:border-[#FF003C] text-xs font-semibold transition-all shadow-sm"
                    title="Twitter"
                  >
                    <Twitter className="w-3.5 h-3.5 text-slate-300" />
                    <span>Twitter / X</span>
                  </a>
                )}

                <button
                  onClick={handleSharePortfolio}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-[#1C0A10] hover:bg-[#2A0F18] text-[#FF4D6D] hover:text-white border border-[#FF003C]/40 hover:border-[#FF003C] text-xs font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(255,0,60,0.25)]"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#FF003C]" />
                  <span>{copiedLink ? 'Link Copied!' : 'Share Portfolio'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Home Page Content: ALL uploads and links shown on home */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Search Bar */}
        {(files.length > 2 || links.length > 1) && (
          <div className="relative max-w-md mx-auto sm:mx-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search uploads and project links..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B0E14] border border-[#20131A] text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#FF003C] focus:shadow-[0_0_20px_rgba(255,0,60,0.3)] transition-all"
            />
          </div>
        )}

        {/* SECTION 1: UPLOADED FILES & WORK */}
        <section className="space-y-5">
          <div className="flex items-center justify-between border-b border-[#20131A] pb-3">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Files className="w-5 h-5 text-[#FF003C]" />
              <span>Uploaded Files & Work</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">
              {filteredFiles.length} item{filteredFiles.length === 1 ? '' : 's'}
            </span>
          </div>

          {filteredFiles.length === 0 ? (
            <div className="vault-panel rounded-2xl p-10 text-center text-slate-500 text-xs">
              No files found matching your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFiles.map((file) => {
                const isImage = file.mimeType.startsWith('image/');
                const isVideo = file.mimeType.startsWith('video/');

                return (
                  <div
                    key={file.id}
                    onClick={() => setPreviewFile(file)}
                    className="vault-panel vault-panel-hover rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between transition-all duration-200 group border border-[#20131A]"
                  >
                    {/* Thumbnail Container */}
                    <div className="relative h-48 bg-[#050608] border-b border-[#20131A] flex items-center justify-center overflow-hidden">
                      {isImage ? (
                        <img
                          src={`/api/public/files/${file.id}/view`}
                          alt={file.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : isVideo ? (
                        <div className="relative w-full h-full bg-[#080A0E] flex items-center justify-center">
                          <Video className="w-12 h-12 text-[#FF003C]" />
                          <span className="absolute bottom-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 text-[#FF4D6D] border border-[#FF003C]/40">
                            PLAY VIDEO
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-500">
                          <div className="w-14 h-14 rounded-2xl bg-[#140A10] border border-[#FF003C]/30 flex items-center justify-center text-[#FF003C] mb-2 shadow-[0_0_15px_rgba(255,0,60,0.25)]">
                            <FileText className="w-7 h-7" />
                          </div>
                          <span className="text-[11px] font-mono text-slate-400 uppercase">
                            {file.mimeType.split('/')[1] || 'DOCUMENT'}
                          </span>
                        </div>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-[#050608]/85 text-white border border-[#331018] backdrop-blur-md">
                          {file.category}
                        </span>

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-md font-bold backdrop-blur-md ${
                            file.downloadAllowed
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                              : 'bg-red-950/80 text-[#FF4D6D] border border-[#FF003C]/50'
                          }`}
                        >
                          {file.downloadAllowed ? 'Downloadable' : 'Preview Only'}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-[#FF003C] transition-colors line-clamp-1">
                          {file.title || file.originalName}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {file.description || file.originalName}
                        </p>

                        {/* Tags */}
                        {file.tags && file.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {file.tags.map((t, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-2 py-0.5 rounded bg-[#050608] text-slate-400 border border-[#20131A]"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-[#20131A] flex items-center justify-between text-xs text-slate-400">
                        <span className="font-mono text-[11px]">{formatBytes(file.size)}</span>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewFile(file);
                            }}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#140A10] hover:bg-[#240F18] text-[#FF4D6D] hover:text-white border border-[#FF003C]/40 hover:border-[#FF003C] font-semibold text-xs transition-all cursor-pointer shadow-[0_0_10px_rgba(255,0,60,0.15)]"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#FF003C]" />
                            <span>Inspect</span>
                          </button>

                          {file.downloadAllowed ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/api/public/files/${file.id}/download`;
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E121A] transition-colors cursor-pointer"
                              title="Download File"
                            >
                              <Download className="w-4 h-4 text-emerald-400" />
                            </button>
                          ) : (
                            <span
                              className="p-1.5 text-slate-600"
                              title="Download Restricted: Preview Only"
                            >
                              <Lock className="w-4 h-4 text-[#FF003C]/60" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 2: PROJECT LINKS & REPOSITORIES */}
        {filteredLinks.length > 0 && (
          <section className="space-y-5 pt-4">
            <div className="flex items-center justify-between border-b border-[#20131A] pb-3">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-[#FF003C]" />
                <span>Project Links & Repositories</span>
              </h2>
              <span className="text-xs font-mono text-slate-400">
                {filteredLinks.length} link{filteredLinks.length === 1 ? '' : 's'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLinks.map((link) => (
                <div
                  key={link.id}
                  onClick={() => handleLinkClick(link.id, link.url)}
                  className="vault-panel vault-panel-hover rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-200 group border border-[#20131A]"
                >
                  <div>
                    {link.thumbnailUrl && (
                      <div className="relative h-40 w-full rounded-xl overflow-hidden mb-3.5 border border-[#20131A] bg-[#050608]">
                        <img
                          src={link.thumbnailUrl}
                          alt={link.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#140A10] text-[#FF4D6D] border border-[#FF003C]/30">
                        {link.category}
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-[#FF003C] transition-colors" />
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-[#FF003C] transition-colors mb-2">
                      {link.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                      {link.description}
                    </p>

                    {link.tags && link.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {link.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#050608] text-slate-400 border border-[#20131A]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#20131A] flex items-center justify-between text-xs text-[#FF4D6D] font-bold">
                    <span className="truncate max-w-[200px]">
                      {link.url.replace(/^https?:\/\//, '')}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[#FF003C]" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#20131A] py-8 text-center text-xs text-slate-500 bg-[#050608]">
        <p>
          <strong className="text-slate-200">BLESSED DAVID OGLEKWU</strong> — Personal Portfolio & Digital Vault · Nigeria
        </p>
      </footer>

      {/* File Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          isAdmin={false}
        />
      )}

      {/* Change Photo Modal for Admin */}
      {isPhotoModalOpen && (
        <ChangePhotoModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          currentAvatarUrl={profile.avatarUrl}
          onPhotoUpdated={handlePhotoUpdated}
        />
      )}
    </div>
  );
};
