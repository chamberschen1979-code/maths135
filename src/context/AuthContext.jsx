import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  validateUser,
  createUser,
  getAllUsers,
  deleteUser,
  updateUserPermission,
  hasAssessmentAccess,
  ADMIN_USERNAME
} from '../utils/userManager';

const AuthContext = createContext(null);

const initializeAuth = () => {
  const saved = localStorage.getItem('maths_current_user');
  if (!saved) return { currentUser: null, isAdmin: false };

  if (saved === ADMIN_USERNAME) {
    return { currentUser: saved, isAdmin: true };
  }

  const users = getAllUsers();
  if (users[saved]) {
    return { currentUser: saved, isAdmin: false };
  }

  localStorage.removeItem('maths_current_user');
  return { currentUser: null, isAdmin: false };
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(initializeAuth);
  const [loginError, setLoginError] = useState('');

  const login = useCallback((username, password) => {
    setLoginError('');
    const result = validateUser(username, password);
    if (result.success) {
      localStorage.setItem('maths_current_user', username);
      setAuthState({ currentUser: username, isAdmin: result.isAdmin || false });
      return true;
    } else {
      setLoginError(result.error || '登录失败');
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('maths_current_user');
    setAuthState({ currentUser: null, isAdmin: false });
  }, []);

  const checkAssessmentAccess = useCallback(() => {
    if (!authState.currentUser) return false;
    return hasAssessmentAccess(authState.currentUser);
  }, [authState.currentUser]);

  const getUsers = useCallback(() => {
    return Object.entries(getAllUsers()).map(([username, data]) => ({
      username,
      ...data,
      hasAssessmentAccess: hasAssessmentAccess(username)
    }));
  }, []);

  const addUser = useCallback((username, password) => {
    return createUser(username, password);
  }, []);

  const removeUser = useCallback((username) => {
    return deleteUser(username);
  }, []);

  const toggleAssessmentAccess = useCallback((username) => {
    const users = getAllUsers();
    const currentAccess = users[username]?.hasAssessmentAccess || false;
    return updateUserPermission(username, !currentAccess);
  }, []);

  const value = {
    currentUser: authState.currentUser,
    isAdmin: authState.isAdmin,
    isLoggedIn: !!authState.currentUser,
    loginError,
    login,
    logout,
    checkAssessmentAccess,
    getUsers,
    addUser,
    removeUser,
    toggleAssessmentAccess
  };

  return (
    <AuthContext.Provider value={value}>
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

export default AuthContext;
