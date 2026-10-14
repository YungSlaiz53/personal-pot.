import {
  VaultFile,
  VaultFolder,
  VaultLink,
  VaultSettings,
  VaultOverviewStats,
  VaultMessage,
  PublicPortfolioProfile
} from '../types/vault';

const TOKEN_KEY = 'myvault_admin_token';

export const authStorage = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clearToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  }
};

function getAuthHeaders(): HeadersInit {
  const token = authStorage.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Public Endpoints
  public: {
    async getProfile(): Promise<PublicPortfolioProfile> {
      const res = await fetch('/api/public/profile');
      return handleResponse<PublicPortfolioProfile>(res);
    },
    async getFiles(): Promise<VaultFile[]> {
      const res = await fetch('/api/public/files');
      return handleResponse<VaultFile[]>(res);
    },
    async getFolders(): Promise<VaultFolder[]> {
      const res = await fetch('/api/public/folders');
      return handleResponse<VaultFolder[]>(res);
    },
    async getLinks(): Promise<VaultLink[]> {
      const res = await fetch('/api/public/links');
      return handleResponse<VaultLink[]>(res);
    },
    async getStats(): Promise<{ totalPublicFiles: number; totalPublicLinks: number; categoriesCount: number }> {
      const res = await fetch('/api/public/stats');
      return handleResponse(res);
    },
    async trackLinkClick(id: string): Promise<void> {
      await fetch(`/api/public/links/${id}/click`, { method: 'POST' }).catch(() => {});
    },
    async sendContact(data: { name: string; email: string; subject: string; message: string }): Promise<{ success: boolean; message: string }> {
      const res = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return handleResponse(res);
    },
    getFileViewUrl(id: string): string {
      return `/api/public/files/${id}/view`;
    },
    getFileDownloadUrl(id: string): string {
      return `/api/public/files/${id}/download`;
    }
  },

  // Auth Endpoints
  auth: {
    async login(email: string, password: string): Promise<{ token: string; user: { id: string; email: string; name: string } }> {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await handleResponse<{ token: string; user: { id: string; email: string; name: string } }>(res);
      authStorage.setToken(data.token);
      return data;
    },
    async checkMe(): Promise<{ user: { id: string; email: string; name: string } }> {
      const res = await fetch('/api/auth/me', {
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    async logout(): Promise<void> {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders()
      }).catch(() => {});
      authStorage.clearToken();
    },
    async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      return handleResponse(res);
    }
  },

  // Admin Endpoints
  admin: {
    async getOverview(): Promise<VaultOverviewStats> {
      const res = await fetch('/api/admin/overview', {
        headers: getAuthHeaders()
      });
      return handleResponse<VaultOverviewStats>(res);
    },
    async getFiles(params?: { folderId?: string; category?: string; visibility?: string; isTrash?: boolean; search?: string }): Promise<VaultFile[]> {
      const query = new URLSearchParams();
      if (params?.folderId) query.set('folderId', params.folderId);
      if (params?.category) query.set('category', params.category);
      if (params?.visibility) query.set('visibility', params.visibility);
      if (params?.isTrash) query.set('isTrash', 'true');
      if (params?.search) query.set('search', params.search);

      const res = await fetch(`/api/admin/files?${query.toString()}`, {
        headers: getAuthHeaders()
      });
      return handleResponse<VaultFile[]>(res);
    },
    async uploadFiles(
      formData: FormData,
      onProgress?: (percent: number) => void
    ): Promise<{ success: boolean; count: number; files: VaultFile[] }> {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/admin/files/upload');

        const token = authStorage.getToken();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              onProgress(percent);
            }
          };
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              reject(e);
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.error || `Upload failed with status ${xhr.status}`));
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error('Network error during file upload'));
        xhr.send(formData);
      });
    },
    async updateFile(id: string, data: Partial<VaultFile>): Promise<VaultFile> {
      const res = await fetch(`/api/admin/files/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data)
      });
      return handleResponse<VaultFile>(res);
    },
    async deleteFile(id: string, permanent = false): Promise<{ success: boolean; message: string }> {
      const res = await fetch(`/api/admin/files/${id}?permanent=${permanent ? 'true' : 'false'}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    async restoreFile(id: string): Promise<{ success: boolean; message: string }> {
      const res = await fetch(`/api/admin/files/${id}/restore`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    async emptyTrash(): Promise<{ success: boolean; count: number }> {
      const res = await fetch('/api/admin/trash/empty', {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    async getFolders(): Promise<VaultFolder[]> {
      const res = await fetch('/api/admin/folders', {
        headers: getAuthHeaders()
      });
      return handleResponse<VaultFolder[]>(res);
    },
    async createFolder(data: Partial<VaultFolder>): Promise<VaultFolder> {
      const res = await fetch('/api/admin/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data)
      });
      return handleResponse<VaultFolder>(res);
    },
    async updateFolder(id: string, data: Partial<VaultFolder>): Promise<VaultFolder> {
      const res = await fetch(`/api/admin/folders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data)
      });
      return handleResponse<VaultFolder>(res);
    },
    async deleteFolder(id: string): Promise<{ success: boolean; message: string }> {
      const res = await fetch(`/api/admin/folders/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    async getLinks(): Promise<VaultLink[]> {
      const res = await fetch('/api/admin/links', {
        headers: getAuthHeaders()
      });
      return handleResponse<VaultLink[]>(res);
    },
    async uploadLinkThumbnail(file: File): Promise<{ url: string; fileId: string }> {
      const formData = new FormData();
      formData.append('thumbnail', file);
      const res = await fetch('/api/admin/links/upload-thumbnail', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });
      return handleResponse<{ url: string; fileId: string }>(res);
    },
    async createLink(data: Partial<VaultLink>): Promise<VaultLink> {
      const res = await fetch('/api/admin/links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data)
      });
      return handleResponse<VaultLink>(res);
    },
    async updateLink(id: string, data: Partial<VaultLink>): Promise<VaultLink> {
      const res = await fetch(`/api/admin/links/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data)
      });
      return handleResponse<VaultLink>(res);
    },
    async deleteLink(id: string): Promise<{ success: boolean; message: string }> {
      const res = await fetch(`/api/admin/links/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return handleResponse(res);
    },
    async getSettings(): Promise<VaultSettings> {
      const res = await fetch('/api/admin/settings', {
        headers: getAuthHeaders()
      });
      return handleResponse<VaultSettings>(res);
    },
    async updateSettings(data: Partial<VaultSettings>): Promise<VaultSettings> {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data)
      });
      return handleResponse<VaultSettings>(res);
    },
    async uploadPhoto(file: File, target: 'avatar' | 'other' = 'avatar'): Promise<{ success: boolean; avatarUrl: string; photoUrl: string; file: VaultFile }> {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await fetch(`/api/admin/photo/upload?target=${target}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });
      return handleResponse(res);
    },
    async updateAvatar(avatarUrl: string): Promise<{ success: boolean; avatarUrl: string }> {
      const res = await fetch('/api/admin/avatar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ avatarUrl })
      });
      return handleResponse(res);
    },
    async getMessages(): Promise<VaultMessage[]> {
      const res = await fetch('/api/admin/messages', {
        headers: getAuthHeaders()
      });
      return handleResponse<VaultMessage[]>(res);
    },
    async markMessageRead(id: string): Promise<void> {
      await fetch(`/api/admin/messages/${id}/read`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
    },
    async deleteMessage(id: string): Promise<void> {
      await fetch(`/api/admin/messages/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    },
    getAdminViewUrl(id: string): string {
      return `/api/admin/files/${id}/view`;
    },
    getAdminDownloadUrl(id: string): string {
      return `/api/admin/files/${id}/download`;
    }
  }
};
