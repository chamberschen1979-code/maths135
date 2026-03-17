const LaoQiaoWarning = ({ show, message, onClose }) => {
  if (!show || !message) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[90] animate-slide-in">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="text-3xl">🎖️</div>
          <div className="flex-1">
            <p className="text-white font-bold mb-1">老乔提示</p>
            <p className="text-white/90 text-sm">{message}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

export default LaoQiaoWarning
