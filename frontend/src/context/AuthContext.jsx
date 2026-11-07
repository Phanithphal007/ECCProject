import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [role, setRole] = useState(() => {
    const current = authService.getCurrentUser();
    return current?.role || localStorage.getItem('edumanage-role') || 'admin';
  });

  const isAuthenticated = Boolean(user && user.id);

  const login = async (credentials) => {
    const res = await authService.login(credentials);
    setUser(res.user);
    setRole(res.user.role);
    return res;
  };

  const demoLogin = async (targetRole) => {
    const res = await authService.demoLogin(targetRole);
    setUser(res.user);
    setRole(res.user.role);
    return res;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    setUser(res.user);
    setRole(res.user.role);
    return res;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        login,
        demoLogin,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

