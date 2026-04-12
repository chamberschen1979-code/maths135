import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getUserProgress,
  getMasteredPool,
  addToMasteredPool,
  removeFromMasteredPool,
  getWeakPointBuffer,
  addToWeakPointBuffer,
  removeFromWeakPointBuffer,
  isInCooldown,
  getCooldownRemainingDays,
  getL4MasteryCounter,
  incrementL4Mastery,
  checkL4Mastered,
  filterAvailableSeeds,
  getCooledQuestions,
  markAsMastered,
  markAsWeak,
  resetAllProgress,
  getProgressStats,
  getUserAddedPool,
  addToUserPool,
  removeFromUserPool,
  generateUserQuestionId
} from '../utils/questionStateManager';

const UserProgressContext = createContext(null);

export const UserProgressProvider = ({ children }) => {
  const [masteredPool, setMasteredPool] = useState([]);
  const [weakPointBuffer, setWeakPointBuffer] = useState({});
  const [l4MasteryCounter, setL4MasteryCounter] = useState({});
  const [userAddedPool, setUserAddedPool] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const progress = getUserProgress();
    setMasteredPool(progress.mastered_pool || []);
    setWeakPointBuffer(progress.weak_point_buffer || {});
    setL4MasteryCounter(progress.l4_mastery_counter || {});
    setUserAddedPool(progress.user_added_pool || []);
    setIsLoaded(true);
      masteredCount: progress.mastered_pool?.length || 0,
      weakCount: Object.keys(progress.weak_point_buffer || {}).length,
      userAddedCount: progress.user_added_pool?.length || 0
    });
  }, []);

  const handleMarkAsMastered = useCallback((questionId, level) => {
    const result = markAsMastered(questionId, level);
    
    const progress = getUserProgress();
    setMasteredPool(progress.mastered_pool || []);
    setWeakPointBuffer(progress.weak_point_buffer || {});
    setL4MasteryCounter(progress.l4_mastery_counter || {});
    
    return result;
  }, []);

  const handleMarkAsWeak = useCallback((questionId, level, motifId) => {
    const result = markAsWeak(questionId, level, motifId);
    
    const progress = getUserProgress();
    setWeakPointBuffer(progress.weak_point_buffer || {});
    
    return result;
  }, []);

  const handleRemoveFromMasteredPool = useCallback((questionId) => {
    removeFromMasteredPool(questionId);
    const progress = getUserProgress();
    setMasteredPool(progress.mastered_pool || []);
  }, []);

  const handleRemoveFromWeakPointBuffer = useCallback((questionId) => {
    removeFromWeakPointBuffer(questionId);
    const progress = getUserProgress();
    setWeakPointBuffer(progress.weak_point_buffer || {});
  }, []);

  const handleResetAllProgress = useCallback(() => {
    resetAllProgress();
    setMasteredPool([]);
    setWeakPointBuffer({});
    setL4MasteryCounter({});
  }, []);

  const handleFilterAvailableSeeds = useCallback((originalPool) => {
    return filterAvailableSeeds(originalPool, {
      masteredPool,
      weakPointBuffer
    });
  }, [masteredPool, weakPointBuffer]);

  const handleIsInCooldown = useCallback((questionId) => {
    return isInCooldown(questionId);
  }, []);

  const handleGetCooldownRemainingDays = useCallback((questionId) => {
    return getCooldownRemainingDays(questionId);
  }, []);

  const handleCheckL4Mastered = useCallback((questionId) => {
    return checkL4Mastered(questionId);
  }, []);

  const handleGetCooledQuestions = useCallback(() => {
    return getCooledQuestions(weakPointBuffer);
  }, [weakPointBuffer]);

  const handleGetProgressStats = useCallback(() => {
    return getProgressStats();
  }, []);

  const handleAddToUserPool = useCallback((question) => {
    const result = addToUserPool(question);
    const progress = getUserProgress();
    setUserAddedPool(progress.user_added_pool || []);
    return result;
  }, []);

  const handleRemoveFromUserPool = useCallback((questionId) => {
    removeFromUserPool(questionId);
    const progress = getUserProgress();
    setUserAddedPool(progress.user_added_pool || []);
  }, []);

  const handleGetUserAddedPool = useCallback(() => {
    return getUserAddedPool();
  }, []);

  const value = {
    masteredPool,
    weakPointBuffer,
    l4MasteryCounter,
    userAddedPool,
    isLoaded,
    markAsMastered: handleMarkAsMastered,
    markAsWeak: handleMarkAsWeak,
    removeFromMasteredPool: handleRemoveFromMasteredPool,
    removeFromWeakPointBuffer: handleRemoveFromWeakPointBuffer,
    resetAllProgress: handleResetAllProgress,
    filterAvailableSeeds: handleFilterAvailableSeeds,
    isInCooldown: handleIsInCooldown,
    getCooldownRemainingDays: handleGetCooldownRemainingDays,
    checkL4Mastered: handleCheckL4Mastered,
    getCooledQuestions: handleGetCooledQuestions,
    getProgressStats: handleGetProgressStats,
    addToUserPool: handleAddToUserPool,
    removeFromUserPool: handleRemoveFromUserPool,
    getUserAddedPool: handleGetUserAddedPool,
    generateUserQuestionId,
    userProgress: {
      masteredPool,
      weakPointBuffer,
      l4MasteryCounter,
      userAddedPool
    }
  };

  return (
    <UserProgressContext.Provider value={value}>
      {children}
    </UserProgressContext.Provider>
  );
};

export const useUserProgress = () => {
  const context = useContext(UserProgressContext);
  if (!context) {
    throw new Error('useUserProgress must be used within a UserProgressProvider');
  }
  return context;
};

export default UserProgressContext;
