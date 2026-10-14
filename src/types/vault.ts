export interface VaultFile {
  id: string;
  originalName: string;
  filename: string;
  mimeType: string;
  size: number;
  title: string;
  description: string;
  category: string;
  folderId: string | null;
  tags: string[];
  visibility: 'public' | 'private';
  downloadAllowed: boolean;
  downloadsCount: number;
  viewsCount: number;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultFolder {
  id: string;
  name: string;
  category: string;
  description: string;
  color: string;
  icon?: string;
  filesCount?: number;
  storageBytes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VaultLink {
  id: string;
  title: string;
  url: string;
  description: string;
  category: string;
  tags: string[];
  thumbnailUrl?: string;
  visibility: 'public' | 'private';
  clicksCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VaultSettings {
  portfolioName: string;
  ownerName: string;
  ownerTitle: string;
  bio: string;
  avatarUrl: string;
  email: string;
  phone: string;
  location: string;
  socialLinks: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    dribbble?: string;
    youtube?: string;
    website?: string;
  };
  defaultVisibility: 'public' | 'private';
  defaultDownloadAllowed: boolean;
  publicIntroduction: string;
  visibleCategories: string[];
}

export interface VaultOverviewStats {
  totalFiles: number;
  totalFolders: number;
  totalLinks: number;
  totalStorage: number;
  publicFiles: number;
  privateFiles: number;
  trashCount: number;
  unreadMessages: number;
  breakdown: Record<string, { count: number; bytes: number }>;
  recentUploads: VaultFile[];
  recentModified: VaultFile[];
}

export interface VaultMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface PublicPortfolioProfile {
  portfolioName: string;
  ownerName: string;
  ownerTitle: string;
  bio: string;
  avatarUrl: string;
  email: string;
  phone: string;
  location: string;
  socialLinks: Record<string, string>;
  publicIntroduction: string;
  visibleCategories: string[];
}
