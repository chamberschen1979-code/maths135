import { Moon, Sun, Settings, ChevronDown, LayoutDashboard, Target, Crosshair, BookOpen, Calendar } from 'lucide-react'
import UserSwitcher from './UserSwitcher'

const tabs = [
  { id: 'dashboard', label: '知识图谱', icon: LayoutDashboard },
  { id: 'training', label: '学习进度', icon: Target },
  { id: 'diagnosis', label: '错题诊断', icon: Crosshair },
  { id: 'formula', label: '方法工具', icon: BookOpen },
  { id: 'weekly', label: '每周任务', icon: Calendar },
]

const Navigation = ({
  activeTab,
  setActiveTab,
  currentGrade,
  setCurrentGrade,
  isAcademicMode,
  setIsAcademicMode,
  gradeDropdownOpen,
  setGradeDropdownOpen,
  onInitClick
}) => {
  return (
    <>
      {/* 侧边导航 - 桌面端 */}
      <nav className="hidden md:flex flex-col w-20 bg-white dark:bg-zinc-950 border-r border-slate-200 dark:border-zinc-800 flex-shrink-0">
        <div className="flex-1 flex flex-col items-center py-6 space-y-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
                    : 'text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs">{tab.label}</span>
              </button>
            )
          })}
        </div>
        <div className="pb-2 flex flex-col items-center space-y-2">
          <UserSwitcher />
          <div className="relative">
            <button
              onClick={() => setGradeDropdownOpen(!gradeDropdownOpen)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all text-xs font-bold ${
                currentGrade === '高三' ? 'text-red-500' : currentGrade === '高二' ? 'text-blue-500' : 'text-green-500'
              } bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700`}
            >
              <span>{currentGrade}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${gradeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {gradeDropdownOpen && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-slate-200 dark:border-zinc-700 overflow-hidden z-50">
                {['高一', '高二', '高三'].map((grade) => (
                  <button
                    key={grade}
                    onClick={() => {
                      setCurrentGrade(grade)
                      setGradeDropdownOpen(false)
                    }}
                    className={`block w-full px-4 py-2 text-xs font-medium transition-colors ${
                      currentGrade === grade
                        ? grade === '高三' ? 'bg-red-100 dark:bg-red-900/30 text-red-500' :
                          grade === '高二' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                          'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
                        : 'text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setIsAcademicMode(!isAcademicMode)}
            className="flex flex-col items-center gap-1 p-3 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/50 transition-all"
          >
            {isAcademicMode ? (
              <>
                <Moon className="w-5 h-5" />
                <span className="text-xs">深色</span>
              </>
            ) : (
              <>
                <Sun className="w-5 h-5" />
                <span className="text-xs">浅色</span>
              </>
            )}
          </button>
        </div>
      </nav>

      {/* 底部导航 - 移动端 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 flex justify-around items-center z-50">
        {tabs.slice(0, 4).map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 p-2 transition-all ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-400 dark:text-zinc-500'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{tab.label}</span>
            </button>
          )
        })}
        <UserSwitcher />
      </nav>
    </>
  )
}

export default Navigation
