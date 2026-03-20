import React, { useState, useRef, useEffect, useCallback } from 'react'
import { 
  Camera, CheckCircle, XCircle, AlertTriangle, RefreshCw, Award, 
  Loader2, Zap, BookOpen, Trophy, Star, ArrowRight, Target,
  Lock, Sparkles, Type, Image, ChevronDown, ChevronUp
} from 'lucide-react'
import { 
  gradeCertification, 
  gradeCertificationText,
  generateCertificationQuestion, 
  generateRemedialQuestion 
} from '../../services/aiVisionService'
import { markAsCertified } from '../../utils/weaponProgress'
import katex from 'katex'
import 'katex/dist/katex.min.css'

const FIVE_DIMENSIONS = [
  { id: 'D1', name: '基础识别', icon: '🎯', desc: '识别题目特征，判断是否适用该方法' },
  { id: 'D2', name: '陷阱规避', icon: '⚠️', desc: '识别并规避常见陷阱' },
  { id: 'D3', name: '核心应用', icon: '🔧', desc: '正确应用核心解题步骤' },
  { id: 'D4', name: '变式迁移', icon: '🔄', desc: '在变式情境中灵活应用' },
  { id: 'D5', name: '综合压轴', icon: '🏆', desc: '解决综合性压轴问题' }
]

const PASS_THRESHOLD = 0.6

const LatexText = ({ text, className = '' }) => {
  if (!text) return <span className={className}></span>
  
  try {
    const parts = []
    const blockRegex = /\$\$([\s\S]*?)\$\$/g
    const inlineRegex = /\$([^$\n]+?)\$/g
    
    let content = text
    const allMatches = []
    
    let match
    while ((match = blockRegex.exec(content)) !== null) {
      allMatches.push({
        type: 'block',
        start: match.index,
        end: match.index + match[0].length,
        content: match[1].trim()
      })
    }
    
    while ((match = inlineRegex.exec(content)) !== null) {
      const isInsideBlock = allMatches.some(
        m => m.type === 'block' && match.index >= m.start && match.index < m.end
      )
      if (!isInsideBlock) {
        allMatches.push({
          type: 'inline',
          start: match.index,
          end: match.index + match[0].length,
          content: match[1].trim()
        })
      }
    }
    
    allMatches.sort((a, b) => a.start - b.start)
    
    let currentIndex = 0
    allMatches.forEach((m, idx) => {
      if (m.start > currentIndex) {
        parts.push(
          <span key={`text-${idx}`}>{content.substring(currentIndex, m.start)}</span>
        )
      }
      
      try {
        const html = katex.renderToString(m.content, {
          throwOnError: false,
          displayMode: m.type === 'block'
        })
        
        if (m.type === 'block') {
          parts.push(
            <div 
              key={`latex-${idx}`} 
              className="my-2 overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )
        } else {
          parts.push(
            <span 
              key={`latex-${idx}`} 
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )
        }
      } catch (e) {
        parts.push(<span key={`latex-${idx}`} className="text-red-500">${m.content}$</span>)
      }
      
      currentIndex = m.end
    })
    
    if (currentIndex < content.length) {
      parts.push(<span key="text-end">{content.substring(currentIndex)}</span>)
    }
    
    if (parts.length === 0) {
      return <span className={className}>{text}</span>
    }
    
    return <span className={className}>{parts}</span>
  } catch (e) {
    console.error('[LatexText] 渲染错误:', e)
    return <span className={className}>{text}</span>
  }
}

const TopProgressMap = ({ currentStep, passedCount, totalQuestions = 5 }) => {
  const scrollRef = useRef(null)
  
  useEffect(() => {
    if (scrollRef.current) {
      const currentElement = scrollRef.current.children[currentStep]
      if (currentElement) {
        currentElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      }
    }
  }, [currentStep])
  
  return (
    <div className="bg-slate-800 px-4 py-4 border-b border-slate-700">
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide justify-center"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {[...Array(totalQuestions)].map((_, idx) => {
          const isPassed = idx < passedCount
          const isCurrent = idx === currentStep
          const isLocked = idx > currentStep
          
          return (
            <div 
              key={idx}
              className="flex flex-col items-center min-w-[80px]"
            >
              <div 
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-base font-bold
                  transition-all duration-300 relative
                  ${isPassed 
                    ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                    : isCurrent 
                      ? 'bg-indigo-500 text-white border-2 border-indigo-300 animate-pulse shadow-lg shadow-indigo-500/30'
                      : 'bg-slate-700 text-slate-400 border border-slate-600'
                  }
                `}
              >
                {isPassed ? (
                  <CheckCircle size={20} />
                ) : isLocked ? (
                  <Lock size={18} />
                ) : isCurrent ? (
                  <span className="animate-pulse font-black">{idx + 1}</span>
                ) : (
                  idx + 1
                )}
                
                {isCurrent && (
                  <div className="absolute -inset-1 rounded-full border-2 border-indigo-400 animate-ping opacity-30" />
                )}
              </div>
              
              <span className="text-sm text-slate-300 mt-2 font-bold">
                Q{idx + 1}
              </span>
            </div>
          )
        })}
      </div>
      
      <div className="flex justify-center items-center mt-3 text-sm text-slate-400">
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
          {passedCount}/{totalQuestions} 已通过
        </span>
      </div>
    </div>
  )
}

const Confetti = () => {
  const colors = ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#8B5CF6']
  
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: `-10%`,
            width: `${Math.random() * 10 + 5}px`,
            height: `${Math.random() * 10 + 5}px`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${Math.random() * 3 + 2}s`
          }}
        />
      ))}
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  )
}

const BadgeUnlock = () => {
  return (
    <div className="relative">
      <div className="absolute inset-0 animate-ping opacity-30">
        <Award className="w-24 h-24 text-yellow-400" />
      </div>
      <Award className="w-24 h-24 text-yellow-400 drop-shadow-2xl animate-bounce" />
      <div className="absolute -top-2 -right-2">
        <Sparkles className="w-8 h-8 text-yellow-300 animate-pulse" />
      </div>
    </div>
  )
}

const CertificationExam = ({ weapon, onComplete, onExit }) => {
  const [status, setStatus] = useState('intro')
  const [questions, setQuestions] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [textAnswer, setTextAnswer] = useState('')
  const [inputMode, setInputMode] = useState('photo')
  const [error, setError] = useState(null)
  const [passedCount, setPassedCount] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [generatingQuestion, setGeneratingQuestion] = useState(null)
  const [showSolution, setShowSolution] = useState(false)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  if (!weapon) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <p className="text-slate-500">加载中...</p>
      </div>
    )
  }

  const cert = weapon.certification || {}
  const focusLogic = cert.focusLogic || weapon.logic_flow || '核心解题步骤'
  const antiPattern = cert.antiPattern || '跳步或逻辑跳跃'
  const triggerKeywords = weapon.trigger_keywords || []
  const scenarioTags = cert.scenarioTags || cert.scenarios || []

  const getScenarioForStep = useCallback((step) => {
    const baseScenarios = scenarioTags.length > 0 ? scenarioTags : triggerKeywords
    const fallbackTags = ['基础概念', '易错陷阱', '参数讨论', '综合应用', '创新压轴']
    
    if (baseScenarios.length >= 5) {
      const stepSize = Math.floor(baseScenarios.length / 5)
      return baseScenarios[Math.min(step * stepSize, baseScenarios.length - 1)]
    } else if (baseScenarios.length > 0) {
      return baseScenarios[step % baseScenarios.length]
    }
    return fallbackTags[step]
  }, [scenarioTags, triggerKeywords])

  const generateNextQuestion = async (step) => {
    setStatus('LOADING')
    setError(null)
    setGeneratingQuestion(step + 1)
    
    try {
      const dimension = FIVE_DIMENSIONS[step] || FIVE_DIMENSIONS[0]
      const scenarioTag = getScenarioForStep(step)
      const difficulty = dimension.difficulty
      
      console.log(`[出题] Q${step + 1}: 维度=${dimension.name}, 场景=${scenarioTag}, 难度=${difficulty}`)
      
      const questionData = await generateCertificationQuestion(weapon, scenarioTag, difficulty)
      
      const newQuestion = {
        id: `Q${step + 1}`,
        ...questionData,
        dimension: dimension,
        scenarioTag: scenarioTag,
        difficulty: difficulty,
        status: 'pending',
        isRemedial: false
      }
      
      setQuestions(prev => {
        const updated = [...prev]
        updated[step] = newQuestion
        return updated
      })
      
      setCurrentStep(step)
      setGeneratingQuestion(null)
      setStatus('QUIZ')
    } catch (err) {
      console.error('[出题失败]', err)
      setError('题目生成失败: ' + err.message)
      setGeneratingQuestion(null)
      setStatus('intro')
    }
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件')
      return
    }

    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64Data = event.target.result
      setSelectedImage(base64Data)
      submitForGrading(base64Data, 'image')
    }
    reader.readAsDataURL(file)
  }

  const submitForGrading = async (data, mode) => {
    setStatus('GRADING')
    setError(null)
    
    try {
      let result
      if (mode === 'text') {
        result = await gradeCertificationText(data, {
          name: weapon.name,
          logic_flow: weapon.logic_flow,
          certification: weapon.certification
        })
      } else {
        result = await gradeCertification(data, {
          name: weapon.name,
          logic_flow: weapon.logic_flow,
          certification: weapon.certification
        })
      }
      
      setFeedback(result)
      setShowSolution(false)
      setStatus('FEEDBACK')
    } catch (err) {
      console.error('[评分失败]', err)
      setError(err.message || 'AI 评分失败，请重试')
      setStatus('QUIZ')
    }
  }

  const handleTextSubmit = () => {
    if (!textAnswer.trim()) {
      setError('请输入你的答案')
      return
    }
    submitForGrading(textAnswer.trim(), 'text')
  }

  const handleQuestionPass = async () => {
    const updatedQuestions = [...questions]
    if (updatedQuestions[currentStep]) {
      updatedQuestions[currentStep].status = 'passed'
    }
    setQuestions(updatedQuestions)
    setPassedCount(prev => prev + 1)
    setSelectedImage(null)
    setTextAnswer('')
    setFeedback(null)
    setShowSolution(false)
    
    if (currentStep >= 4) {
      setShowConfetti(true)
      setStatus('SUCCESS')
    } else {
      const nextStep = currentStep + 1
      await generateNextQuestion(nextStep)
    }
  }

  const handleRemedial = async () => {
    setStatus('LOADING')
    setError(null)
    setGeneratingQuestion(`补考-Q${currentStep + 1}`)
    
    try {
      const currentQuestion = questions[currentStep]
      
      const updatedQuestions = [...questions]
      if (updatedQuestions[currentStep] && updatedQuestions[currentStep].status !== 'passed') {
        updatedQuestions[currentStep] = {
          ...updatedQuestions[currentStep],
          status: 'failed'
        }
      }
      setQuestions(updatedQuestions)
      
      const failedQuestions = updatedQuestions.filter(q => q?.status === 'failed')
      const targetQuestion = failedQuestions[0] || currentQuestion
      
      const remedialData = await generateRemedialQuestion(
        weapon, 
        targetQuestion?.scenarioTag || '基础', 
        feedback?.feedback || '需要加强该维度的练习'
      )
      
      const remedialQuestion = {
        id: `R${Date.now()}`,
        ...remedialData,
        dimension: targetQuestion?.dimension || FIVE_DIMENSIONS[currentStep] || FIVE_DIMENSIONS[0],
        scenarioTag: targetQuestion?.scenarioTag || '补考',
        difficulty: 'L1',
        status: 'pending',
        isRemedial: true
      }
      
      const targetStep = updatedQuestions.findIndex(q => q?.id === targetQuestion?.id)
      const insertStep = targetStep >= 0 ? targetStep : currentStep
      
      const finalQuestions = [...updatedQuestions]
      finalQuestions[insertStep] = remedialQuestion
      
      setQuestions(finalQuestions)
      setCurrentStep(insertStep)
      setSelectedImage(null)
      setTextAnswer('')
      setFeedback(null)
      setShowSolution(false)
      setGeneratingQuestion(null)
      setStatus('QUIZ')
    } catch (err) {
      console.error('[补考题生成失败]', err)
      setError('补考题生成失败: ' + err.message)
      setGeneratingQuestion(null)
      setStatus('FEEDBACK')
    }
  }

  const handleSkip = async () => {
    setSelectedImage(null)
    setTextAnswer('')
    setFeedback(null)
    setShowSolution(false)
    
    if (currentStep >= 4) {
      if (passedCount >= 3) {
        setShowConfetti(true)
        setStatus('SUCCESS')
      } else {
        setStatus('REMEDIATION')
      }
    } else {
      const nextStep = currentStep + 1
      await generateNextQuestion(nextStep)
    }
  }

  const handleConfirmPass = () => {
    markAsCertified(weapon.id)
    onComplete(weapon.id)
  }

  const handleRetry = () => {
    setSelectedImage(null)
    setTextAnswer('')
    setFeedback(null)
    setError(null)
    setQuestions([])
    setCurrentStep(0)
    setPassedCount(0)
    setShowConfetti(false)
    setGeneratingQuestion(null)
    setShowSolution(false)
    setInputMode('photo')
    setStatus('intro')
  }

  const insertLatex = (latex) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const newText = textAnswer.substring(0, start) + `$${latex}$` + textAnswer.substring(end)
      setTextAnswer(newText)
      setTimeout(() => {
        textareaRef.current.focus()
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + latex.length + 2
      }, 0)
    }
  }

  const currentQuestion = questions[currentStep]

  const renderIntro = () => (
    <div className="flex flex-col h-full bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 animate-in fade-in duration-500">
      <div className="flex-grow overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl flex-shrink-0">
              <Award className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-black text-slate-900">{weapon.name}</h2>
              <p className="text-indigo-600 font-bold text-lg">五维全景认证挑战</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            {FIVE_DIMENSIONS.map((dim, idx) => (
              <div 
                key={dim.id} 
                className="flex flex-col items-center p-6 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all cursor-default"
              >
                <span className="text-4xl mb-3">{dim.icon}</span>
                <span className="text-lg font-bold text-slate-800 text-center mb-1">{dim.name}</span>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-bold rounded-full">
                  Q{idx + 1}
                </span>
                <p className="text-xs text-slate-500 text-center mt-2">{dim.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-slate-200 shadow-lg">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              评分核心标准
            </h3>
            <ol className="list-decimal list-inside space-y-3 text-slate-700">
              <li>必须手写完整解题过程，仅写答案无效。</li>
              <li className="font-medium text-blue-700">
                必须显式体现 "<LatexText text={focusLogic} />" 这一逻辑步骤。
              </li>
              <li className="font-medium text-red-600">
                AI 将严格检查是否出现 "{antiPattern}" 的情况。
              </li>
            </ol>
          </div>

          <button 
            onClick={() => generateNextQuestion(0)}
            className="w-full py-5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white text-xl font-bold rounded-2xl shadow-2xl hover:shadow-indigo-500/40 transition-all transform hover:-translate-y-1 active:scale-98 flex items-center justify-center gap-3"
          >
            <Zap className="w-6 h-6" />
            开始闯关认证
          </button>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 border border-red-200">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
          
          <button onClick={onExit} className="mt-4 w-full text-slate-500 hover:text-slate-700 text-sm py-2">
            取消挑战
          </button>
        </div>
      </div>
    </div>
  )

  const renderLoading = () => (
    <div className="flex flex-col h-full bg-gradient-to-br from-indigo-50 via-white to-purple-50 animate-in fade-in duration-300">
      <TopProgressMap currentStep={currentStep} passedCount={passedCount} />
      
      <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
        <div className="relative mb-6">
          <Loader2 className="w-20 h-20 text-indigo-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">{FIVE_DIMENSIONS[currentStep]?.icon || '🎯'}</span>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          正在生成 Q{generatingQuestion || currentStep + 1}...
        </h2>
        <p className="text-slate-500 max-w-md mb-6">
          AI 正在为「{weapon.name}」命制第 {generatingQuestion || currentStep + 1} 道题目
        </p>
        
        <div className="bg-white p-5 rounded-xl shadow-lg border border-indigo-100 max-w-sm">
          <p className="text-sm text-slate-600">
            💡 维度：<span className="font-bold text-indigo-700">{FIVE_DIMENSIONS[currentStep]?.name}</span>
          </p>
          <p className="text-sm text-slate-500 mt-1">
            场景：{getScenarioForStep(currentStep)}
          </p>
        </div>
      </div>
    </div>
  )

  const renderQuiz = () => {
    if (!currentQuestion) return null
    
    return (
      <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{currentQuestion.dimension?.icon || '🎯'}</span>
              <div>
                <h3 className="font-bold text-lg">{currentQuestion.dimension?.name || '维度' + (currentStep + 1)}</h3>
                <p className="text-xs text-slate-400">{currentQuestion.scenarioTag}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black">Q{currentStep + 1}</span>
              <span className="text-slate-400 text-lg">/5</span>
            </div>
          </div>
        </div>
        
        <TopProgressMap currentStep={currentStep} passedCount={passedCount} />

        <div className="flex-grow overflow-y-auto p-6">
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 mb-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              <span className="font-bold text-slate-700">题目 Q{currentStep + 1}</span>
            </div>
            <div className="text-slate-800 leading-relaxed text-lg">
              <LatexText text={currentQuestion.questionText} />
            </div>
          </div>

          <div className="bg-indigo-50 rounded-xl p-4 mb-6 border border-indigo-200">
            <h4 className="font-bold text-indigo-800 mb-2">📝 答题要求</h4>
            <ul className="text-sm text-indigo-700 space-y-1 list-disc list-inside">
              <li>请手写完整解题过程，仅写答案无效</li>
              <li>必须显式体现核心解题步骤</li>
              <li>字迹清晰，步骤完整</li>
            </ul>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setInputMode('photo')}
              className={`flex-1 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                inputMode === 'photo' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Image size={18} />
              📷 拍照上传
            </button>
            <button
              onClick={() => setInputMode('text')}
              className={`flex-1 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                inputMode === 'text' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Type size={18} />
              ⌨️ 文本录入
            </button>
          </div>

          {inputMode === 'photo' ? (
            selectedImage ? (
              <div className="relative mb-6">
                <img src={selectedImage} alt="解题过程" className="w-full rounded-xl border-2 border-indigo-200 shadow-lg" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-all"
                >
                  <XCircle size={20} />
                </button>
              </div>
            ) : (
              <div 
                onClick={handleFileSelect}
                className="border-2 border-dashed border-slate-300 rounded-xl p-10 flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all"
              >
                <Camera className="w-14 h-14 text-slate-400 mb-4" />
                <p className="text-slate-600 font-medium text-lg">点击拍照或上传解题过程</p>
                <p className="text-sm text-slate-400 mt-2">请确保字迹清晰，光线充足</p>
              </div>
            )
          ) : (
            <div className="mb-6">
              <div className="flex gap-2 mb-3 flex-wrap">
                <button onClick={() => insertLatex('frac{a}{b}')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-sm font-mono">分数</button>
                <button onClick={() => insertLatex('sqrt{x}')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-sm font-mono">根号</button>
                <button onClick={() => insertLatex('x^{2}')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-sm font-mono">上标</button>
                <button onClick={() => insertLatex('x_{n}')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-sm font-mono">下标</button>
                <button onClick={() => insertLatex('\\geq')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-sm font-mono">≥</button>
                <button onClick={() => insertLatex('\\leq')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-sm font-mono">≤</button>
                <button onClick={() => insertLatex('\\neq')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-sm font-mono">≠</button>
                <button onClick={() => insertLatex('\\infty')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-sm font-mono">∞</button>
              </div>
              <textarea
                ref={textareaRef}
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="请输入你的答案，支持 LaTeX 公式（如 $\\frac{1}{2}$、$x^2$）..."
                className="w-full h-40 p-4 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none resize-none text-slate-700"
              />
              <p className="text-xs text-slate-400 mt-2">提示：用 $...$ 包裹公式，如 $x^2 + y^2 = 1$</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2 border border-red-200">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
          />
        </div>

        <div className="sticky bottom-0 p-4 bg-white border-t border-slate-200 shadow-lg">
          <div className="flex gap-3">
            <button 
              onClick={handleRetry}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-all"
            >
              退出
            </button>
            {inputMode === 'photo' && selectedImage && (
              <button 
                onClick={() => submitForGrading(selectedImage, 'image')}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                提交评分
              </button>
            )}
            {inputMode === 'text' && (
              <button 
                onClick={handleTextSubmit}
                disabled={!textAnswer.trim()}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle size={20} />
                提交评分
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderGrading = () => (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
      <TopProgressMap currentStep={currentStep} passedCount={passedCount} />
      
      <div className="flex-grow flex flex-col items-center justify-center bg-gradient-to-b from-indigo-50 via-white to-purple-50 p-8 text-center">
        <div className="relative">
          <Loader2 className="w-20 h-20 text-indigo-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">{currentQuestion?.dimension?.icon || '🎯'}</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mt-6 mb-2">AI 教练阅卷中...</h2>
        <p className="text-slate-500 max-w-md mb-6">
          正在分析 Q{currentStep + 1} 的解题步骤
        </p>
        <div className="bg-white p-5 rounded-xl shadow-lg border border-indigo-100 max-w-sm">
          <p className="text-sm text-slate-600">
            💡 重点检查：
          </p>
          <p className="font-bold text-indigo-700 mt-1"><LatexText text={focusLogic} /></p>
        </div>
      </div>
    </div>
  )

  const renderFeedback = () => {
    const isPassed = feedback?.passed
    const isLastQuestion = currentStep >= 4
    
    return (
      <div className="flex flex-col h-full bg-white animate-in slide-in-from-right-8 duration-500">
        <div className={`p-6 text-center relative overflow-hidden ${isPassed ? 'bg-gradient-to-r from-green-600 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'} text-white`}>
          <div className="relative z-10">
            {isPassed ? (
              <CheckCircle className="w-16 h-16 mx-auto mb-3 text-green-200" />
            ) : (
              <XCircle className="w-16 h-16 mx-auto mb-3 text-red-200" />
            )}
            <h2 className="text-2xl font-black mb-1">
              {isPassed ? 'Q' + (currentStep + 1) + ' 通过！' : 'Q' + (currentStep + 1) + ' 未通过'}
            </h2>
            <p className="opacity-90">
              {isPassed ? '继续保持！' : '查看解析，准备补考'}
            </p>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-5">
          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">本题得分</span>
              <span className={`text-3xl font-black ${isPassed ? 'text-green-600' : 'text-red-500'}`}>
                {feedback?.score || 0}/100
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 mb-4">
            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              AI 点评
            </h3>
            <div className="text-slate-700 text-sm leading-relaxed">
              <LatexText text={feedback?.feedback} />
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-4 border border-green-200 mb-4">
            <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2 text-sm">
              <CheckCircle size={16} className="text-green-600" />
              参考答案
            </h3>
            <div className="text-green-700 text-sm">
              <LatexText text={currentQuestion?.answerKey} />
            </div>
          </div>

          <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-200 mb-4">
            <h3 className="font-bold text-indigo-800 mb-1 flex items-center gap-2 text-sm">
              <Target size={14} className="text-indigo-600" />
              核心考点
            </h3>
            <p className="text-indigo-700 text-sm">
              <LatexText text={currentQuestion?.keyLogicPoint} />
            </p>
          </div>

          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 mb-4">
            <h3 className="font-bold text-amber-800 mb-1 flex items-center gap-2 text-sm">
              <AlertTriangle size={14} className="text-amber-600" />
              陷阱提示
            </h3>
            <p className="text-amber-700 text-sm">
              <LatexText text={currentQuestion?.trapDescription} />
            </p>
          </div>

          {!isPassed && feedback?.missingStep && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-200 mb-4">
              <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2 text-sm">
                <AlertTriangle size={14} className="text-red-600" />
                缺失的关键步骤
              </h3>
              <div className="text-red-700 text-sm">
                <LatexText text={feedback.missingStep} />
              </div>
            </div>
          )}

          {currentQuestion?.standardSolution && (
            <div className="border border-slate-200 rounded-xl mb-4 overflow-hidden">
              <button
                onClick={() => setShowSolution(!showSolution)}
                className="w-full p-4 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between hover:from-indigo-100 hover:to-purple-100 transition-all"
              >
                <span className="font-bold text-indigo-800 flex items-center gap-2">
                  <BookOpen size={16} />
                  查看标准解析
                </span>
                {showSolution ? <ChevronUp size={20} className="text-indigo-600" /> : <ChevronDown size={20} className="text-indigo-600" />}
              </button>
              {showSolution && (
                <div className="p-4 bg-white border-t border-slate-200">
                  <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                    <LatexText text={currentQuestion.standardSolution} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200">
          {isPassed ? (
            <button 
              onClick={handleQuestionPass}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {isLastQuestion ? (
                <>
                  <Trophy size={20} />
                  查看总成绩
                </>
              ) : (
                <>
                  下一关 (Q{currentStep + 2})
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                <p className="text-red-700 font-medium text-sm">
                  需要 <strong>补考题</strong> 强化「{currentQuestion?.scenarioTag}」
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={handleSkip}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
                >
                  跳过
                </button>
                <button 
                  onClick={handleRemedial}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  补考
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderRemediation = () => {
    const failedQuestions = questions.filter(q => q?.status === 'failed')
    
    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-amber-50 via-white to-orange-50 p-8 animate-in fade-in duration-500">
        <div className="flex-grow flex flex-col items-center text-center max-w-lg mx-auto">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center mb-6 shadow-xl">
            <RefreshCw className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-2xl font-black text-slate-900 mb-2">需要补考强化</h2>
          <p className="text-slate-500 mb-6">
            通过 {passedCount}/5 题，未达到 3 题及格线
          </p>

          <div className="bg-white rounded-xl p-5 w-full mb-6 border border-slate-200 shadow-lg">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              薄弱维度
            </h3>
            <div className="space-y-2">
              {failedQuestions.map((q, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                  <span className="text-xl">{q?.dimension?.icon}</span>
                  <div className="text-left flex-grow">
                    <p className="font-medium text-red-800">{q?.dimension?.name}</p>
                    <p className="text-xs text-red-600">{q?.scenarioTag}</p>
                  </div>
                  <XCircle size={18} className="text-red-500" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 w-full">
            <button 
              onClick={onExit}
              className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
            >
              暂时放弃
            </button>
            <button 
              onClick={handleRemedial}
              className="flex-1 py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={20} />
              开始补考
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderSuccess = () => {
    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-green-50 via-white to-emerald-50 animate-in fade-in duration-500 relative">
        {showConfetti && <Confetti />}
        
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white p-8 text-center relative overflow-hidden">
          <div className="relative z-10">
            <BadgeUnlock />
            <h2 className="text-3xl font-black mb-2 mt-4">🎉 认证通过！</h2>
            <p className="opacity-90 text-lg">恭喜掌握「{weapon.name}」</p>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-6">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-200 mb-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              成绩单
            </h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <p className="text-3xl font-black text-green-600">{passedCount}</p>
                <p className="text-xs text-slate-500 mt-1">通过题数</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                <p className="text-3xl font-black text-indigo-600">5</p>
                <p className="text-xs text-slate-500 mt-1">总题数</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                <p className="text-3xl font-black text-amber-600">{Math.round(passedCount / 5 * 100)}%</p>
                <p className="text-xs text-slate-500 mt-1">正确率</p>
              </div>
            </div>

            <h4 className="font-bold text-slate-700 mb-3 text-sm">各关卡详情</h4>
            <div className="space-y-2">
              {questions.filter(q => q).map((q, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-xl ${
                    q?.status === 'passed' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}
                >
                  <span className="text-lg">{q?.dimension?.icon}</span>
                  <div className="flex-grow">
                    <p className="font-medium text-slate-700 text-sm">Q{idx + 1} · {q?.dimension?.name}</p>
                  </div>
                  {q?.status === 'passed' 
                    ? <CheckCircle size={18} className="text-green-500" /> 
                    : <XCircle size={18} className="text-red-500" />
                  }
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-slate-200">
          <button 
            onClick={handleConfirmPass}
            className="w-full py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Award size={20} />
            领取徽章并退出
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl overflow-hidden shadow-2xl">
      {status === 'intro' && renderIntro()}
      {status === 'LOADING' && renderLoading()}
      {status === 'QUIZ' && renderQuiz()}
      {status === 'GRADING' && renderGrading()}
      {status === 'FEEDBACK' && renderFeedback()}
      {status === 'REMEDIATION' && renderRemediation()}
      {status === 'SUCCESS' && renderSuccess()}
    </div>
  )
}

export default CertificationExam
