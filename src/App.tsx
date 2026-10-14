import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { OverviewDashboard } from './components/admin/OverviewDashboard';
import { FileExplorer } from './components/admin/FileExplorer';
import { FolderManager } from './components/admin/FolderManager';
import { LinksManager } from './components/admin/LinksManager';
import { TrashView } from './components/admin/TrashView';
import { SettingsView } from './components/admin/SettingsView';
import { MessagesView } from './components/admin/MessagesView';
import { PublicPortfolio } from './components/public/PublicPortfolio';
import { UploadModal } from './components/admin/UploadModal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { FilePreviewModal } from './components/shared/FilePreviewModal';
import {
  VaultOverviewStats,
  VaultFile,
  VaultFolder,
  VaultLink,
  VaultSettings,
  VaultMessage
} from './types/vault';
import { api } from './services/api';

const VaultMainContent: React.FC = () => {
  const {
    isAuthenticated,
    isPublicMode,
    activeView,
    setActiveView,
    setShowLoginModal,
    isLoading: isAuthLoading
  } = useAuth();

  const [stats, setStats] = useState<VaultOverviewStats | null>(null);
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [links, setLinks] = useState<VaultLink[]>([]);
  const [messages, setMessages] = useState<VaultMessage[]>([]);
  const [settings, setSettings] = useState<VaultSettings | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFolderForUpload, setSelectedFolderForUpload] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Folder drill-down filter state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const loadAdminData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingData(true);
    try {
      const [statsData, filesData, foldersData, linksData, settingsData, msgsData] =
        await Promise.all([
          api.admin.getOverview(),
          api.admin.getFiles(),
          api.admin.getFolders(),
          api.admin.getLinks(),
          api.admin.getSettings(),
          api.admin.getMessages()
        ]);

      setStats(statsData);
      setFiles(filesData);
      setFolders(foldersData);
      setLinks(linksData);
      setSettings(settingsData);
      setMessages(msgsData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated, loadAdminData]);

  // If in public portfolio mode, render public experience directly!
  if (isPublicMode) {
    return (
      <div className="min-h-screen bg-[#06070A] text-[#F5F7FA]">
        <Header
          onOpenUpload={() => setIsUploadOpen(true)}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          sidebarOpen={sidebarOpen}
        />
        <PublicPortfolio />
        <AdminLoginModal />
      </div>
    );
  }

  // If in admin mode but not authenticated yet, render login screen
  if (!isAuthenticated && !isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#050608] text-[#F8FAFC] flex flex-col">
        <Header
          onOpenUpload={() => {}}
          onToggleSidebar={() => {}}
          sidebarOpen={false}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF003C]/12 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 w-20 h-20 rounded-3xl bg-[#1C0A10] border border-[#FF003C]/40 text-[#FF003C] flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(255,0,60,0.4)]">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="relative z-10 text-2xl sm:text-3xl font-black text-white">Administrator Vault Locked</h2>
          <p className="relative z-10 text-sm text-slate-400 mt-2 max-w-md">
            The admin console allows file uploads, folder reorganization, and visibility controls. Please sign in to authenticate.
          </p>
          <div className="relative z-10 mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#FF003C] to-[#C9002E] hover:from-[#FF1E46] hover:to-[#FF003C] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(255,0,60,0.5)] cursor-pointer"
            >
              Sign In as Administrator
            </button>
          </div>
        </div>
        <AdminLoginModal />
      </div>
    );
  }

  // Active files (excluding trash)
  const activeFiles = files.filter((f) => !f.isDeleted);
  const trashFiles = files.filter((f) => f.isDeleted);

  return (
    <div className="min-h-screen bg-[#06070A] text-[#F5F7FA] flex flex-col">
      {/* Top Navigation */}
      <Header
        onOpenUpload={() => setIsUploadOpen(true)}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        sidebarOpen={sidebarOpen}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          storageUsed={stats?.totalStorage || 0}
          totalFilesCount={activeFiles.length}
          unreadCount={messages.filter((m) => !m.read).length}
        />

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#06070A]">
          {activeView === 'overview' && (
            <OverviewDashboard
              stats={stats}
              onOpenUpload={() => setIsUploadOpen(true)}
              onOpenCreateFolder={() => setActiveView('folders')}
              onOpenCreateLink={() => setActiveView('links')}
              onSelectFile={(f) => setPreviewFile(f)}
            />
          )}

          {activeView === 'all-files' && (
            <FileExplorer
              files={activeFiles}
              folders={folders}
              activeCategoryFilter="All"
              onPreviewFile={(f) => setPreviewFile(f)}
              onFilesChanged={loadAdminData}
            />
          )}

          {activeView === 'folders' && (
            <FolderManager
              folders={folders}
              files={activeFiles}
              onFoldersChanged={loadAdminData}
              onOpenFolderFiles={(fldId) => {
                setSelectedFolderId(fldId);
                setActiveView('all-files');
              }}
            />
          )}

          {activeView === 'documents' && (
            <FileExplorer
              files={activeFiles}
              folders={folders}
              activeCategoryFilter="Documents"
              onPreviewFile={(f) => setPreviewFile(f)}
              onFilesChanged={loadAdminData}
            />
          )}

          {activeView === 'images' && (
            <FileExplorer
              files={activeFiles}
              folders={folders}
              activeCategoryFilter="Graphic Design"
              onPreviewFile={(f) => setPreviewFile(f)}
              onFilesChanged={loadAdminData}
            />
          )}

          {activeView === 'videos' && (
            <FileExplorer
              files={activeFiles}
              folders={folders}
              activeCategoryFilter="Video Projects"
              onPreviewFile={(f) => setPreviewFile(f)}
              onFilesChanged={loadAdminData}
            />
          )}

          {activeView === 'links' && (
            <LinksManager
              links={links}
              onLinksChanged={loadAdminData}
            />
          )}

          {activeView === 'private-files' && (
            <FileExplorer
              files={activeFiles.filter((f) => f.visibility === 'private')}
              folders={folders}
              activeVisibilityFilter="private"
              onPreviewFile={(f) => setPreviewFile(f)}
              onFilesChanged={loadAdminData}
            />
          )}

          {activeView === 'trash' && (
            <TrashView
              trashFiles={trashFiles}
              onRefresh={loadAdminData}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView
              initialSettings={settings}
              onSettingsUpdated={loadAdminData}
            />
          )}

          {activeView === 'messages' && (
            <MessagesView
              messages={messages}
              onRefresh={loadAdminData}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => {
          setIsUploadOpen(false);
          setSelectedFolderForUpload(null);
        }}
        folders={folders}
        defaultFolderId={selectedFolderForUpload}
        onUploadComplete={() => {
          loadAdminData();
        }}
      />

      <AdminLoginModal />

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          isAdmin={true}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <VaultMainContent />
    </AuthProvider>
  );
}
