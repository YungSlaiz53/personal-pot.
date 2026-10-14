import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, authStorage } from '../services/api';

export type VaultNavView =
  | 'overview'
  | 'all-files'
  | 'folders'
  | 'documents'
  | 'images'
  | 'videos'
  | 'links'
  | 'public-portfolio'
  | 'private-files'
  | 'trash'
  | 'settings'
  | 'messages';

interface UserInfo {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserInfo | null;
  isLoading: boolean;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  activeView: VaultNavView;
  setActiveView: (view: VaultNavView) => void;
  isPublicMode: boolean;
  setIsPublicMode: (publicMode: boolean) => void;
  enterAdminPortal: () => void;
  login: (userInput: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  getPublicUrl: () => string;
  getAdminUrl: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<VaultNavView>('overview');

  // URL differentiation: Public link vs Admin link
  const [isPublicMode, setIsPublicMode] = useState<boolean>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminExplicit =
      urlParams.has('admin') ||
      urlParams.get('mode') === 'admin' ||
      window.location.hash === '#admin';
    if (isAdminExplicit) {
      return false; // User clicked Admin link!
    }
    // Default for everyone else is public portfolio view
    return true;
  });

  useEffect(() => {
    async function verifyAuth() {
      const token = authStorage.getToken();
      const urlParams = new URLSearchParams(window.location.search);
      const isAdminExplicit =
        urlParams.has('admin') ||
        urlParams.get('mode') === 'admin' ||
        window.location.hash === '#admin';

      if (!token) {
        setIsLoading(false);
        setIsAuthenticated(false);
        setUser(null);
        if (isAdminExplicit) {
          setShowLoginModal(true);
        }
        return;
      }

      try {
        const data = await api.auth.checkMe();
        setIsAuthenticated(true);
        setUser(data.user);
        if (isAdminExplicit) {
          setIsPublicMode(false);
        }
      } catch {
        authStorage.clearToken();
        setIsAuthenticated(false);
        setUser(null);
        if (isAdminExplicit) {
          setShowLoginModal(true);
        }
      } finally {
        setIsLoading(false);
      }
    }

    verifyAuth();
  }, []);

  const login = async (userInput: string, pass: string) => {
    const res = await api.auth.login(userInput, pass);
    setIsAuthenticated(true);
    setUser(res.user);
    setShowLoginModal(false);
    setIsPublicMode(false);
  };

  const logout = async () => {
    await api.auth.logout();
    setIsAuthenticated(false);
    setUser(null);
    setIsPublicMode(true);
    setActiveView('overview');
    // Clean up admin query param if present
    if (window.history.pushState) {
      const newUrl = window.location.pathname;
      window.history.pushState({ path: newUrl }, '', newUrl);
    }
  };

  const enterAdminPortal = () => {
    if (isAuthenticated) {
      setIsPublicMode(false);
      setActiveView('overview');
    } else {
      setShowLoginModal(true);
    }
  };

  const getPublicUrl = () => {
    return `${window.location.origin}/`;
  };

  const getAdminUrl = () => {
    return `${window.location.origin}/?admin=true`;
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        showLoginModal,
        setShowLoginModal,
        activeView,
        setActiveView,
        isPublicMode,
        setIsPublicMode,
        enterAdminPortal,
        login,
        logout,
        getPublicUrl,
        getAdminUrl
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
