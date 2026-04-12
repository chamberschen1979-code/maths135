import React from 'react'
import { User, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const UserSwitcher = () => {
  const { currentUser, isAdmin, logout } = useAuth()

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout()
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleLogout}
        className="flex flex-col items-center gap-1 p-2 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all w-full"
        title="退出登录"
      >
        <div className="relative">
          <User className="w-5 h-5" />
          {isAdmin && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border border-white dark:border-zinc-950" />
          )}
        </div>
        <span className="text-xs max-w-[60px] truncate text-center">
          {currentUser || '未知'}
        </span>
        <LogOut className="w-3 h-3" />
      </button>
    </div>
  )
}

export default UserSwitcher
