import React, { useState, useEffect, useRef } from 'react'
import { User, ChevronDown, UserPlus, Check, Trash2 } from 'lucide-react'
import * as userManager from '../utils/userManager'

const UserSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [showNewUserInput, setShowNewUserInput] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setShowNewUserInput(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadData = () => {
    setUsers(userManager.getAllUsers())
    setCurrentUser(userManager.getCurrentUser())
  }

  const handleSwitchUser = (userId) => {
    if (userManager.switchUser(userId)) {
      window.location.reload()
    }
  }

  const handleCreateUser = () => {
    if (newUserName.trim()) {
      userManager.createUser(newUserName.trim())
      window.location.reload()
    }
  }

  const handleDeleteUser = (e, userId) => {
    e.stopPropagation()
    if (users.length <= 1) {
      alert('至少保留一个用户')
      return
    }
    if (confirm('确定删除此用户？所有数据将被清除！')) {
      userManager.deleteUser(userId)
      if (currentUser?.id === userId) {
        const remainingUsers = userManager.getAllUsers()
        if (remainingUsers.length > 0) {
          userManager.switchUser(remainingUsers[0].id)
        }
        window.location.reload()
      } else {
        loadData()
      }
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors text-sm"
      >
        <User className="w-4 h-4 text-slate-600 dark:text-zinc-300" />
        <span className="text-slate-700 dark:text-zinc-200 font-medium max-w-[80px] truncate">
          {currentUser?.name || '未登录'}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-700 overflow-hidden z-50">
          <div className="p-2 border-b border-slate-100 dark:border-zinc-700">
            <span className="text-xs text-slate-400 dark:text-zinc-500 px-2">切换用户</span>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => user.id !== currentUser?.id && handleSwitchUser(user.id)}
                className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors ${
                  user.id === currentUser?.id
                    ? 'bg-blue-50 dark:bg-blue-900/30'
                    : 'hover:bg-slate-50 dark:hover:bg-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${user.id === currentUser?.id ? 'bg-blue-500' : 'bg-slate-300 dark:bg-zinc-600'}`} />
                  <span className="text-sm text-slate-700 dark:text-zinc-200">{user.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  {user.id === currentUser?.id && (
                    <Check className="w-4 h-4 text-blue-500" />
                  )}
                  {users.length > 1 && (
                    <button
                      onClick={(e) => handleDeleteUser(e, user.id)}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 dark:border-zinc-700 p-2">
            {showNewUserInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="用户名"
                  className="flex-1 px-2 py-1.5 text-sm border border-slate-200 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateUser()}
                />
                <button
                  onClick={handleCreateUser}
                  className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  创建
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowNewUserInput(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>新建用户</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default UserSwitcher
