import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getUserData, getActivityStats, getCurrentUser } from '../../utils/userManager';
import { useTrainingCenterData } from '../../hooks/useTrainingCenterData';
import { Users, BarChart3, ChevronRight, Activity, Target, TrendingUp, Award, AlertTriangle, Zap } from 'lucide-react';

const TOTAL_WEAPONS = 65;

const AdminPanel = ({ onClose }) => {
  const { getUsers, addUser, removeUser, toggleAssessmentAccess, isAdmin: isCurrentUserAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('manage');
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const allUsers = getUsers();
  const currentUser = getCurrentUser();
  const isCurrentUserCcb = currentUser === 'ccb';
  let visibleUsers = allUsers.filter(u => u.username !== 'ccb' || isCurrentUserCcb);
  if (isCurrentUserCcb) {
    visibleUsers = [{ username: 'ccb', createdAt: new Date().toISOString(), hasAssessmentAccess: true }, ...visibleUsers];
  }

  const tacticalData = useMemo(() => {
    if (!selectedUser) return null;
    return getUserData(selectedUser.username, 'tactical_data', null);
  }, [selectedUser]);

  const errorNotebook = useMemo(() => {
    if (!selectedUser) return [];
    return getUserData(selectedUser.username, 'error_notebook', []);
  }, [selectedUser]);

  const { stats } = useTrainingCenterData(tacticalData, errorNotebook);

  const activityStats = useMemo(() => {
    if (!selectedUser) return null;
    return getActivityStats(selectedUser.username, 7);
  }, [selectedUser]);

  const certifiedWeapons = useMemo(() => {
    if (!tacticalData?.user_profile?.certifiedWeapons) return [];
    return tacticalData.user_profile.certifiedWeapons;
  }, [tacticalData]);

  React.useEffect(() => {
    if (!selectedUser && visibleUsers.length > 0) {
      const ccbInList = visibleUsers.find(u => u.username === 'ccb');
      setSelectedUser(ccbInList || visibleUsers[0]);
    }
  }, [visibleUsers.length]);

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      showMessage('请填写完整', 'error');
      return;
    }
    const result = addUser(newUsername.trim(), newPassword);
    if (result.success) {
      showMessage(`用户 ${newUsername} 创建成功！`, 'success');
      setNewUsername('');
      setNewPassword('');
    } else {
      showMessage(result.error, 'error');
    }
  };

  const handleDeleteUser = (username) => {
    if (!confirm(`确定删除用户 ${username}？所有学习数据将被清除！`)) return;
    const result = removeUser(username);
    if (result.success) {
      showMessage(`用户 ${username} 已删除`, 'success');
      if (selectedUser?.username === username) setSelectedUser(null);
    } else {
      showMessage(result.error, 'error');
    }
  };

  const handleToggleAccess = (username) => {
    toggleAssessmentAccess(username);
    showMessage(`已更新 ${username} 的学情评估权限`, 'success');
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">管理员面板</h2>
            <div className="flex bg-indigo-500 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('manage')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                  activeTab === 'manage' ? 'bg-white text-indigo-600' : 'text-indigo-100 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />用户管理</span>
              </button>
              <button
                onClick={() => setActiveTab('progress')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                  activeTab === 'progress' ? 'bg-white text-indigo-600' : 'text-indigo-100 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-1.5"><BarChart3 className="w-4 h-4" />学习进度</span>
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-indigo-500 rounded-lg transition">✕</button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'manage' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {message && (
                <div className={`px-4 py-3 rounded-xl text-sm ${
                  messageType === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleCreateUser} className="bg-gray-50 rounded-xl p-4 space-y-4">
                <h3 className="font-semibold text-gray-800">创建新用户</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="用户名"
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="初始密码"
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-2 rounded-xl font-medium hover:bg-indigo-700 transition"
                >
                  创建用户
                </button>
              </form>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">用户列表（{visibleUsers.length}人）</h3>
                <div className="space-y-2">
                  {visibleUsers.map(user => (
                    <div
                      key={user.username}
                      className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3"
                    >
                      <div>
                        <div className="font-medium text-gray-800">{user.username}</div>
                        <div className="text-xs text-gray-500">
                          创建于 {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleAccess(user.username)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                            user.hasAssessmentAccess
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          学情评估 {user.hasAssessmentAccess ? '✓' : '✗'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.username)}
                          className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-xs font-medium hover:bg-red-200 transition"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                  {visibleUsers.length === 0 && (
                    <div className="text-center text-gray-400 py-8 text-sm">暂无普通用户</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="flex-1 flex overflow-hidden">
              <div className="w-48 border-r border-gray-100 overflow-y-auto p-3 space-y-1 flex-shrink-0">
                <div className="text-xs font-semibold text-gray-400 uppercase px-2 py-1">选择用户</div>
                {visibleUsers.map(user => (
                  <button
                    key={user.username}
                    onClick={() => {
                      setSelectedUser(user);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition ${
                      selectedUser?.username === user.username
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate">{user.username}</span>
                    {selectedUser?.username === user.username && <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                  </button>
                ))}
                {visibleUsers.length === 0 && (
                  <div className="text-xs text-gray-400 text-center py-4">暂无用户</div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {!selectedUser ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Users className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm">请从左侧选择用户</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{selectedUser.username}</h3>
                        <p className="text-sm text-gray-500">
                          创建于 {new Date(selectedUser.createdAt).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                      {selectedUser.hasAssessmentAccess && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          学情评估已开通
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-4 h-4 text-blue-600" />
                          <span className="text-base font-semibold text-blue-700">elo分数</span>
                        </div>
                        <div className="flex items-baseline gap-3">
                          <span className="text-xl font-bold text-blue-800">{stats.totalElo.toLocaleString()}</span>
                          <span className="text-xs font-semibold text-blue-600">段位 {stats.level}</span>
                          {activityStats && activityStats.eloDelta !== 0 && (
                            <span className={`ml-auto text-sm font-bold ${activityStats.eloDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {activityStats.eloDelta > 0 ? '+' : ''}{activityStats.eloDelta}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Target className="w-4 h-4 text-green-600" />
                          <span className="text-base font-semibold text-green-700">通关进度</span>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs text-green-600">变例通关</span>
                            <span className="text-xl font-bold text-green-800">
                              {stats.variationPassCount || 0}
                              <span className="text-xs font-normal text-green-500">/72</span>
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs text-green-600">知识点通关</span>
                            <span className="text-xl font-bold text-green-800">
                              {stats.masteredCount}
                              <span className="text-xs font-normal text-green-500">/174</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Activity className="w-4 h-4 text-amber-600" />
                          <span className="text-base font-semibold text-amber-700">本周训练</span>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-amber-800">{activityStats?.battleCount ?? 0}</span>
                            <span className="text-xs text-amber-500">次训练</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold text-amber-800">{activityStats?.accuracy ?? 0}</span>
                            <span className="text-xs text-amber-500">%准确率</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
                        <div className="flex items-center gap-2 mb-3">
                          <Award className="w-4 h-4 text-purple-600" />
                          <span className="text-base font-semibold text-purple-700">杀手锏认证</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-purple-800">{certifiedWeapons.length}</span>
                          <span className="text-xs text-purple-500">/{TOTAL_WEAPONS}</span>
                        </div>
                      </div>
                    </div>


                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 py-2 rounded-xl font-medium hover:bg-gray-300 transition"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
