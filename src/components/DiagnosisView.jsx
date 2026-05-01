import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { ChevronDown, Crosshair, Target, Paperclip, X } from 'lucide-react'
import { ErrorLibrary } from './weekly'
import BattleScanner from './BattleScanner'

const DiagnosisView = ({
  isAcademicMode,
  messages,
  isLoading,
  inputValue,
  setInputValue,
  selectedImage,
  currentTarget,
  tacticalData,
  errorNotebook,
  setErrorNotebook,
  onSend,
  onKeyPress,
  onRemoveImage,
  onFileUpload,
  onDiagnosisComplete,
  onRealDiagnosis,
  onImageCapture,
  onNavigateBack,
  fileInputRef
}) => {
  const [diagnosisTab, setDiagnosisTab] = useState('ai')
  
  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-zinc-950">
      <header className="h-14 flex items-center justify-between px-4 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-blue-500/30 z-10">
        <div className="w-8"></div>
        <h1 className="text-lg font-semibold text-slate-800 dark:text-zinc-200">
          {isAcademicMode ? '教研组长' : '联络人 · 老乔'}
        </h1>
        <div className="w-8"></div>
      </header>

      <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <button
          onClick={() => setDiagnosisTab('ai')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            diagnosisTab === 'ai'
              ? (isAcademicMode 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                  : 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-900/20')
              : (isAcademicMode 
                  ? 'text-slate-500 hover:text-slate-700' 
                  : 'text-zinc-500 hover:text-zinc-300')
          }`}
        >
          🔍 AI诊断
        </button>
        <button
          onClick={() => setDiagnosisTab('library')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            diagnosisTab === 'library'
              ? (isAcademicMode 
                  ? 'text-red-600 border-b-2 border-red-600 bg-red-50' 
                  : 'text-red-400 border-b-2 border-red-400 bg-red-900/20')
              : (isAcademicMode 
                  ? 'text-slate-500 hover:text-slate-700' 
                  : 'text-zinc-500 hover:text-zinc-300')
          }`}
        >
          📚 错题库
        </button>
      </div>

      {diagnosisTab === 'library' ? (
        <ErrorLibrary
          errorNotebook={errorNotebook}
          setErrorNotebook={setErrorNotebook}
          tacticalData={tacticalData}
          isAcademicMode={isAcademicMode}
          onClose={() => setDiagnosisTab('ai')}
        />
      ) : (
        <>
          <main className="flex-1 overflow-y-auto px-4 bg-slate-50 dark:bg-zinc-950 pb-32 md:pb-24">
            <div className="py-4 space-y-4 max-w-3xl mx-auto">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-zinc-500">
                  <Crosshair className="w-12 h-12 mb-4 text-slate-400 dark:text-zinc-600" />
                  <p className="text-sm">点击下方快捷部署或上传图片</p>
                  <p className="text-xs text-slate-400 dark:text-zinc-600 mt-2">开始对话</p>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white dark:bg-zinc-900 dark:text-zinc-300 dark:border-r-4 dark:border-orange-500'
                        : 'bg-white border border-slate-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-l-4 dark:border-blue-500'
                    }`}
                  >
                    {message.imageBase64 && (
                      <div className="mb-2">
                        <img
                          src={message.imageBase64}
                          alt="图片"
                          className="max-w-full rounded-lg border border-slate-200 dark:border-blue-500/50"
                          style={{ maxHeight: '200px' }}
                        />
                      </div>
                    )}
                    {message.type === 'ai' ? (
                      <div className="prose prose-sm dark:prose-invert prose-blue max-w-none prose-headings:text-slate-800 dark:prose-headings:text-zinc-200 prose-p:text-slate-700 dark:prose-p:text-zinc-300 prose-strong:text-blue-600 dark:prose-strong:text-blue-400">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed prose prose-sm prose-invert max-w-none prose-headings:text-white prose-p:text-white prose-strong:text-blue-200 dark:prose-strong:text-orange-400">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] px-4 py-3 rounded-lg bg-white border border-slate-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:border-l-4 dark:border-blue-500">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                      </div>
                      <span className="text-sm text-slate-500 dark:text-zinc-500">
                        {isAcademicMode ? '正在思考...' : '联络人老乔正在评估战损报告...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>

          <div className="fixed bottom-16 md:bottom-0 left-0 md:left-20 right-0 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 z-20">
            <div className="max-w-3xl mx-auto">
              <div className="px-4 py-2">
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wider">
                  {isAcademicMode ? '快捷选题' : '快捷部署'}
                </span>
              </div>
              <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide">
                {currentTarget && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {currentTarget.target_name}
                  </span>
                )}
              </div>
              
              {selectedImage && (
                <div className="px-4 pt-2">
                  <div className="relative inline-block">
                    <div className="relative rounded-lg border-2 border-blue-500/50 dark:border-blue-500/50 overflow-hidden">
                      <img
                        src={selectedImage.base64}
                        alt="图片"
                        className="h-12 object-contain bg-slate-100 dark:bg-zinc-950"
                      />
                      {selectedImage.type === 'pdf' && (
                        <div className="absolute bottom-0 left-0 right-0 bg-slate-100/80 dark:bg-zinc-900/80 text-xs text-center text-slate-500 dark:text-zinc-400 py-0.5">
                          PDF
                        </div>
                      )}
                    </div>
                    <button
                      onClick={onRemoveImage}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-400 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 p-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={onFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className={`h-9 w-9 flex items-center justify-center rounded-lg transition-all bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 ${
                    isLoading
                      ? 'text-slate-400 dark:text-zinc-600 cursor-not-allowed'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500/50'
                  }`}
                  title="上传图片"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <BattleScanner 
                  onDiagnosisComplete={onDiagnosisComplete}
                  isAcademicMode={isAcademicMode}
                  tacticalData={tacticalData}
                  onRealDiagnosis={onRealDiagnosis}
                  onImageCapture={onImageCapture}
                />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={onKeyPress}
                  placeholder={selectedImage ? "补充说明..." : "输入问题..."}
                  disabled={isLoading}
                  className={`flex-1 h-9 px-3 bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm text-slate-800 dark:text-zinc-200 placeholder-slate-400 dark:placeholder-zinc-600 outline-none focus:border-blue-500 dark:focus:border-blue-500 transition-all ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                <button
                  onClick={onSend}
                  disabled={isLoading || (!inputValue.trim() && !selectedImage)}
                  className={`h-9 px-4 text-white text-sm font-medium rounded-lg transition-all ${
                    isLoading || (!inputValue.trim() && !selectedImage)
                      ? 'bg-slate-300 dark:bg-zinc-700 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-500 dark:bg-blue-600 dark:hover:bg-blue-500 active:scale-95'
                  }`}
                >
                  发送
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default DiagnosisView
