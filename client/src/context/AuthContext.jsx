import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

// Create the context
const AuthContext = createContext(null);

// AuthProvider wraps the entire app and provides auth state everywhere
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while checking session

  // On app load, check if there's an active session (valid JWT cookie)
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const data = await authService.getMe();
      setUser(data.user);
    } catch (error) {
      // No active session — user is logged out
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    const data = await authService.getMe();
    setUser(data.user);
    return data.user;
  };

  // Helper to check role
  const hasRole = (...roles) => {
    return user && roles.includes(user.role);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser,
    hasRole,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth anywhere in the app
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
