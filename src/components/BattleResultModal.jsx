import { Trophy, AlertCircle } from 'lucide-react'

const BattleResultModal = ({
  isOpen,
  onClose,
  result,
  showStreakEffect,
  isAcademicMode
}) => {
  if (!isOpen || !result) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm">
      <div className={`bg-white dark:bg-zinc-900 rounded-2xl p-8 max-w-sm mx-4 text-center border-2 ${
        result.levelUp ? 'border-amber-500' : 'border-slate-200 dark:border-zinc-700'
      } ${showStreakEffect ? 'animate-pulse ring-4 ring-amber-400/50' : ''}`}>
        {showStreakEffect && (
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold animate-bounce">
            🔥 连胜加速中！
          </div>
        )}
        {result.levelUp ? (
          <>
            <Trophy className="w-16 h-16 mx-auto mb-4 text-amber-500 animate-bounce" />
            <h2 className="text-2xl font-bold text-amber-500 mb-2">
              {isAcademicMode ? '能力提升！' : '目标被攻克！'}
            </h2>
            <p className="text-slate-600 dark:text-zinc-300 mb-4">
              Elo <span className="text-blue-600 dark:text-blue-400">{result.eloChange > 0 ? '+' : ''}{result.eloChange}</span>
              {result.winStreak >= 3 && (
                <span className="ml-2 text-amber-500 text-sm">🔥 连胜 x{result.winStreak}</span>
              )}
            </p>
            <p className="text-lg text-amber-500 font-semibold">
              {isAcademicMode ? '等级提升至' : '装备升级至'} {result.newLevel}！
            </p>
          </>
        ) : (
          <>
            <AlertCircle className={`w-12 h-12 mx-auto mb-4 ${
              result.grade === 'S' ? 'text-amber-400' :
              result.grade === 'A' ? 'text-blue-500' :
              result.grade === 'B' ? 'text-blue-400' : 'text-red-400'
            }`} />
            <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-200 mb-2">
              {isAcademicMode ? '学习反馈' : '战局结算'}
            </h2>
            <p className="text-slate-500 dark:text-zinc-400 mb-2">
              评级 <span className={`font-bold ${
                result.grade === 'S' ? 'text-amber-500' :
                result.grade === 'A' ? 'text-blue-500' :
                result.grade === 'B' ? 'text-blue-400' : 'text-red-400'
              }`}>{result.grade}</span>
            </p>
            <p className="text-slate-500 dark:text-zinc-400">
              Elo <span className={result.eloChange > 0 ? 'text-blue-500' : 'text-red-400'}>
                {result.eloChange > 0 ? '+' : ''}{result.eloChange}
              </span>
              {result.winStreak >= 3 && result.eloChange > 0 && (
                <span className="ml-2 text-amber-500 text-sm">🔥 连胜 x{result.winStreak}</span>
              )}
            </p>
          </>
        )}
        <button
          onClick={onClose}
          className="mt-6 px-6 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-lg transition-colors"
        >
          确认
        </button>
      </div>
    </div>
  )
}

export default BattleResultModal
