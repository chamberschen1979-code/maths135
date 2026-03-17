import { useState, useContext, useRef, useCallback } from 'react'
import { Camera, Upload, X, Scan, AlertTriangle, Target, Sparkles, Lock, MapPin, Crop } from 'lucide-react'
import { ThemeContext } from '../App'
import tacticalMapsData from '../data/tacticalMaps.json'
import strategyLib from '../data/strategy_lib.json'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

const CATEGORY_TO_MOTIF = {
  'S-SET': 'M01',
  'S-COMP': 'M01',
  'S-INEQ': 'M02',
  'S-FUNC': 'M03',
  'S-LOG': 'M04',
  'S-VEC': 'M05',
  'S-TRIG': 'M06',
  'S-TRI': 'M07',
  'S-SEQ': 'M08',
  'S-SOLID': 'M09',
  'S-ANAL': 'M10',
  'S-DERIV': 'M11',
  'S-PROB': 'M12',
  'S-COMB': 'M16',
  'S-INNOV': 'M17',
}

const MOTIF_NAMES = {
  'M01': '集合、逻辑与复数',
  'M02': '不等式性质',
  'M03': '函数概念与性质',
  'M04': '指对数函数与运算',
  'M05': '平面向量',
  'M06': '三角函数基础',
  'M07': '解三角形综合',
  'M08': '数列基础与求和',
  'M09': '立体几何基础',
  'M10': '解析几何基础',
  'M11': '导数工具基础',
  'M12': '概率与统计综合',
  'M13': '解析几何综合压轴',
  'M14': '导数综合压轴',
  'M15': '数列综合压轴',
  'M16': '计数原理与二项式',
  'M17': '创新思维与情境',
}

const findMatchingWeapons = (text) => {
  if (!text) return []
  
  const lowerText = text.toLowerCase()
  const matches = []
  
  for (const category of strategyLib.categories) {
    for (const weapon of category.weapons) {
      const keywordMatches = weapon.trigger_keywords.filter(keyword => 
        lowerText.includes(keyword.toLowerCase())
      )
      if (keywordMatches.length > 0) {
        matches.push({
          weaponId: weapon.id,
          weaponName: weapon.name,
          categoryId: category.id,
          categoryName: category.name,
          matchedKeywords: keywordMatches,
          motifId: CATEGORY_TO_MOTIF[category.id],
        })
      }
    }
  }
  
  return matches.sort((a, b) => b.matchedKeywords.length - a.matchedKeywords.length)
}

const LEVEL_THRESHOLDS = {
  L1: { min: 0, max: 1000 },
  L2: { min: 1001, max: 1800 },
  L3: { min: 1801, max: 2500 },
  L4: { min: 2501, max: 3000 },
}

const LEVEL_POINT_VALUE = {
  'L2': 40,
  'L3': 60,
  'L4': 100
}

const getLevelByElo = (elo) => {
  if (elo >= 2501) return 'L4'
  if (elo >= 1801) return 'L3'
  if (elo >= 1001) return 'L2'
  return 'L1'
}

const getMaxEloGain = (currentLevel) => {
  const span = LEVEL_THRESHOLDS[currentLevel].max - LEVEL_THRESHOLDS[currentLevel].min + 1
  return Math.round(span * 0.2)
}

const getTargetData = (targetId) => {
  for (const map of tacticalMapsData.tactical_maps) {
    const encounter = map.encounters.find(e => e.target_id === targetId)
    if (encounter) {
      const benchmarks = []
      if (encounter.specialties) {
        encounter.specialties.forEach(spec => {
          spec.variations?.forEach(v => {
            v.master_benchmarks?.forEach(b => {
              benchmarks.push({
                ...b,
                sub_id: b.id || b.legacy_id,
                sub_name: v.name,
                level_req: b.level,
                spec_name: spec.spec_name
              })
            })
          })
        })
      }
      return {
        targetName: encounter.target_name,
        benchmarks,
        specialties: encounter.specialties,
        mapName: map.map_name
      }
    }
  }
  return null
}

const getMotifCoordinate = (detectedText, targetId = null) => {
  let motifId = null
  let matchedWeapons = []
  
  if (targetId) {
    motifId = targetId
  } else if (detectedText) {
    matchedWeapons = findMatchingWeapons(detectedText)
    if (matchedWeapons.length > 0) {
      motifId = matchedWeapons[0].motifId
    }
  }
  
  if (!motifId) return null
  
  const motifName = MOTIF_NAMES[motifId] || motifId
  
  const tacticalLink = tacticalMapsData.tactical_maps
    .flatMap(map => map.encounters)
    .find(e => e.target_id === motifId)
  
  return {
    motifId,
    motifName,
    matchedWeapons: matchedWeapons.slice(0, 3),
    currentLevel: tacticalLink?.gear_level || 'L1',
    currentElo: tacticalLink?.elo_score || 500
  }
}

const calculateDiagnosisResult = (targetId, greenSubIds, savedData, detectedKnowledgeId = null) => {
  const targetData = getTargetData(targetId)
  if (!targetData) return null
  
  const benchmarks = targetData.benchmarks
  
  const greenBenchmarks = benchmarks.filter(b => greenSubIds.includes(b.sub_id))
  const M = greenBenchmarks.length
  
  let eloGain = 0
  const pointBreakdown = []
  
  greenBenchmarks.forEach(b => {
    const pointValue = LEVEL_POINT_VALUE[b.level_req] || 40
    eloGain += pointValue
    pointBreakdown.push({
      level: b.level_req,
      value: pointValue,
      name: b.sub_name
    })
  })
  
  let l4Bonus = 0
  
  const l4Breakthroughs = greenBenchmarks.filter(b => {
    const wasRed = savedData ? 
      savedData.benchmarks?.find(s => s.sub_id === b.sub_id)?.is_mastered === false : 
      true
    return b.level_req === 'L4' && wasRed
  })
  
  if (l4Breakthroughs.length > 0) {
    l4Bonus = 50
    eloGain += l4Bonus
  }
  
  const currentElo = savedData?.elo_score || 500
  const currentLevel = getLevelByElo(currentElo)
  const maxGain = getMaxEloGain(currentLevel)
  const cappedEloGain = Math.min(eloGain, maxGain)
  
  const hasRedRemaining = benchmarks.some(b => 
    !greenSubIds.includes(b.sub_id) && b.level_req !== 'L1'
  )
  
  let motifCoordinate = null
  if (detectedKnowledgeId) {
    motifCoordinate = getMotifCoordinate(detectedKnowledgeId, targetId)
  } else if (targetId) {
    motifCoordinate = getMotifCoordinate(null, targetId)
  }
  
  return {
    targetId,
    targetName: targetData.targetName,
    mapName: targetData.mapName,
    motifWeight: motifCoordinate?.tacticalRank || 'N/A',
    totalPoints: benchmarks.length,
    conqueredPoints: M,
    pointBreakdown,
    levelPointValue: LEVEL_POINT_VALUE,
    baseEloGain: eloGain - l4Bonus,
    l4Bonus,
    totalEloGain: eloGain,
    cappedEloGain,
    isCapped: eloGain > maxGain,
    hasRedRemaining,
    greenSubIds,
    benchmarks,
    motifCoordinate
  }
}

function BattleScanner({ onDiagnosisComplete, isAcademicMode, tacticalData, onRealDiagnosis }) {
  const { isAcademicMode: contextMode } = useContext(ThemeContext)
  const academicMode = isAcademicMode ?? contextMode
  
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [diagnosisResult, setDiagnosisResult] = useState(null)
  const [showScanner, setShowScanner] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  
  const [upImg, setUpImg] = useState(null)
  const [crop, setCrop] = useState({ unit: '%', width: 90, aspect: 0 })
  const [completedCrop, setCompletedCrop] = useState(null)
  
  const fileInputRef = useRef(null)
  const imgRef = useRef(null)
  const previewCanvasRef = useRef(null)

  const onLoad = useCallback((img) => {
    imgRef.current = img
  }, [])

  const startScanning = (base64Data) => {
    setIsScanning(true)
    setScanProgress(0)
    setShowResult(false)
    setDiagnosisResult(null)
    setErrorMessage(null)
    
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 90) {
          return prev
        }
        return prev + 10
      })
    }, 300)

    if (onRealDiagnosis) {
      onRealDiagnosis(base64Data)
        .then(result => {
          clearInterval(progressInterval)
          setScanProgress(100)
          
          if (result && result.targetId && result.greenSubIds) {
            const savedData = tacticalData?.tactical_maps?.flatMap(m => m.encounters)
              .find(e => e.target_id === result.targetId)
            
            const diagnosisData = calculateDiagnosisResult(
              result.targetId,
              result.greenSubIds,
              savedData,
              result.detectedKnowledgeId
            )
            
            if (diagnosisData && result.message) {
              diagnosisData.message = result.message
            }
            
            setDiagnosisResult(diagnosisData)
            setShowResult(true)
          } else {
            setErrorMessage('AI 诊断未能识别题目，请尝试上传更清晰的图片')
            setShowResult(true)
          }
          setIsScanning(false)
        })
        .catch(error => {
          clearInterval(progressInterval)
          console.error('诊断失败:', error)
          setErrorMessage('诊断请求失败，请稍后重试')
          setShowResult(true)
          setIsScanning(false)
        })
    } else {
      clearInterval(progressInterval)
      setScanProgress(100)
      setErrorMessage('诊断接口未配置')
      setShowResult(true)
      setIsScanning(false)
    }
  }

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      setErrorMessage('请上传图片文件')
      return
    }
    
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const base64Data = e.target?.result
      if (base64Data) {
        setUpImg(base64Data)
        setCrop({ unit: '%', width: 90, aspect: 0 })
        setCompletedCrop(null)
        setCapturedImage(null)
        setErrorMessage(null)
      }
    }
    
    reader.onerror = () => {
      setErrorMessage('图片读取失败，请重试')
    }
    
    reader.readAsDataURL(file)
  }

  const handleConfirmCrop = () => {
    if (!completedCrop || !imgRef.current) {
      if (upImg) {
        setCapturedImage(upImg)
        startScanning(upImg)
      }
      return
    }
    
    const canvas = document.createElement('canvas')
    const img = imgRef.current
    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height
    
    const cropX = completedCrop.x * scaleX
    const cropY = completedCrop.y * scaleY
    const cropWidth = completedCrop.width * scaleX
    const cropHeight = completedCrop.height * scaleY
    
    canvas.width = cropWidth
    canvas.height = cropHeight
    
    const ctx = canvas.getContext('2d')
    
    ctx.drawImage(
      img,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    )
    
    const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9)
    setCapturedImage(croppedBase64)
    setUpImg(null)
    startScanning(croppedBase64)
  }

  const handleSkipCrop = () => {
    if (upImg) {
      setCapturedImage(upImg)
      setUpImg(null)
      startScanning(upImg)
    }
  }

  const handleCameraCapture = () => {
    fileInputRef.current?.click()
  }

  const handleConfirmDiagnosis = () => {
    if (diagnosisResult && onDiagnosisComplete) {
      onDiagnosisComplete({
        targetId: diagnosisResult.targetId,
        greenSubIds: diagnosisResult.greenSubIds,
        eloGain: diagnosisResult.cappedEloGain,
        hasRedRemaining: diagnosisResult.hasRedRemaining
      })
    }
    setShowScanner(false)
    setShowResult(false)
    setDiagnosisResult(null)
    setCapturedImage(null)
    setErrorMessage(null)
    setUpImg(null)
    setCompletedCrop(null)
  }

  const handleCloseScanner = () => {
    setShowScanner(false)
    setIsScanning(false)
    setShowResult(false)
    setDiagnosisResult(null)
    setCapturedImage(null)
    setErrorMessage(null)
    setUpImg(null)
    setCompletedCrop(null)
  }

  const handleBackToUpload = () => {
    setUpImg(null)
    setCompletedCrop(null)
    setCapturedImage(null)
    setErrorMessage(null)
  }

  return (
    <>
      <button
        onClick={() => setShowScanner(true)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          academicMode
            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25'
            : 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600 shadow-lg shadow-emerald-500/25'
        }`}
      >
        <Camera className="w-4 h-4" />
        <span>{academicMode ? '拍照诊断' : '战场扫描'}</span>
      </button>

      {showScanner && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className={`max-w-lg w-full mx-4 rounded-xl border overflow-hidden ${
            academicMode ? 'bg-white border-slate-200' : 'bg-zinc-900 border-zinc-700'
          }`}>
            {!isScanning && !showResult && !upImg && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-bold ${academicMode ? 'text-slate-900' : 'text-zinc-100'}`}>
                    {academicMode ? '拍照诊断' : '战场扫描仪'}
                  </h3>
                  <button
                    onClick={handleCloseScanner}
                    className={`p-1 rounded ${academicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-800'}`}
                  >
                    <X className={`w-5 h-5 ${academicMode ? 'text-slate-500' : 'text-zinc-400'}`} />
                  </button>
                </div>

                <p className={`text-sm mb-6 ${academicMode ? 'text-slate-600' : 'text-zinc-400'}`}>
                  {academicMode 
                    ? '上传错题照片，AI 将自动识别知识漏洞并生成逻辑链路诊断报告。'
                    : '上传战场截图，AI 将扫描你的弱点并生成战术诊断报告。'
                  }
                </p>

                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <button
                    onClick={handleCameraCapture}
                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-lg border-2 border-dashed transition-all ${
                      academicMode
                        ? 'border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-400'
                        : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500'
                    }`}
                  >
                    <Camera className="w-6 h-6" />
                    <span className="font-medium">拍照上传</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-lg border-2 border-dashed transition-all ${
                      academicMode
                        ? 'border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-400'
                        : 'border-zinc-600 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    <Upload className="w-6 h-6" />
                    <span className="font-medium">从相册选择</span>
                  </button>
                </div>

                <div className={`mt-6 p-3 rounded-lg ${academicMode ? 'bg-amber-50 border border-amber-200' : 'bg-amber-900/20 border border-amber-500/30'}`}>
                  <p className={`text-xs ${academicMode ? 'text-amber-600' : 'text-amber-400'}`}>
                    💡 提示：上传后可裁剪题目区域，提高 AI 识别精度。
                  </p>
                </div>
              </div>
            )}

            {!isScanning && !showResult && upImg && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${academicMode ? 'text-slate-900' : 'text-zinc-100'}`}>
                    <Crop className="w-5 h-5 text-blue-500" />
                    裁剪题目区域
                  </h3>
                  <button
                    onClick={handleBackToUpload}
                    className={`p-1 rounded ${academicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-800'}`}
                  >
                    <X className={`w-5 h-5 ${academicMode ? 'text-slate-500' : 'text-zinc-400'}`} />
                  </button>
                </div>

                <p className={`text-sm mb-4 ${academicMode ? 'text-slate-600' : 'text-zinc-400'}`}>
                  拖动框选题目核心区域，过滤背景噪点以提高识别精度。
                </p>

                <div className={`rounded-lg overflow-hidden border mb-4 ${academicMode ? 'border-slate-200' : 'border-zinc-700'}`}>
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                  >
                    <img
                      ref={imgRef}
                      src={upImg}
                      alt="上传的图片"
                      onLoad={onLoad}
                      style={{ maxHeight: '300px', maxWidth: '100%' }}
                    />
                  </ReactCrop>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSkipCrop}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${
                      academicMode
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                    }`}
                  >
                    跳过裁剪
                  </button>
                  <button
                    onClick={handleConfirmCrop}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${
                      academicMode
                        ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25'
                        : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25'
                    }`}
                  >
                    <Crop className="w-4 h-4" />
                    确认裁剪并开始 AI 诊断
                  </button>
                </div>
              </div>
            )}

            {isScanning && (
              <div className="p-8 text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className={`absolute inset-0 rounded-full border-4 ${
                    academicMode ? 'border-blue-200' : 'border-emerald-900'
                  }`}></div>
                  <div 
                    className={`absolute inset-0 rounded-full border-4 border-transparent border-t-current animate-spin ${
                      academicMode ? 'text-blue-500' : 'text-emerald-500'
                    }`}
                    style={{ animationDuration: '1s' }}
                  ></div>
                  <Scan className={`absolute inset-0 m-auto w-8 h-8 ${academicMode ? 'text-blue-500' : 'text-emerald-500'}`} />
                </div>
                
                <h4 className={`text-lg font-bold mb-2 ${academicMode ? 'text-slate-900' : 'text-zinc-100'}`}>
                  AI 深度扫描中...
                </h4>
                <p className={`text-sm mb-4 ${academicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                  正在分析知识点覆盖情况
                </p>
                
                <div className={`w-full h-2 rounded-full overflow-hidden ${academicMode ? 'bg-slate-200' : 'bg-zinc-800'}`}>
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      academicMode ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                    }`}
                    style={{ width: `${Math.min(scanProgress, 100)}%` }}
                  ></div>
                </div>
                <p className={`text-xs mt-2 font-mono ${academicMode ? 'text-slate-400' : 'text-zinc-500'}`}>
                  {Math.min(Math.round(scanProgress), 100)}%
                </p>
                
                {capturedImage && (
                  <div className="mt-4">
                    <img 
                      src={capturedImage} 
                      alt="正在分析" 
                      className="w-full h-24 object-cover rounded-lg border opacity-50"
                    />
                  </div>
                )}
              </div>
            )}

            {showResult && errorMessage && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${academicMode ? 'text-slate-900' : 'text-zinc-100'}`}>
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    诊断结果
                  </h3>
                  <button
                    onClick={handleCloseScanner}
                    className={`p-1 rounded ${academicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-800'}`}
                  >
                    <X className={`w-5 h-5 ${academicMode ? 'text-slate-500' : 'text-zinc-400'}`} />
                  </button>
                </div>

                <div className={`p-4 rounded-lg mb-4 ${academicMode ? 'bg-amber-50 border border-amber-200' : 'bg-amber-900/20 border border-amber-500/30'}`}>
                  <p className={`text-sm ${academicMode ? 'text-amber-700' : 'text-amber-400'}`}>
                    {errorMessage}
                  </p>
                </div>

                {capturedImage && (
                  <div className="mb-4">
                    <img 
                      src={capturedImage} 
                      alt="已上传图片" 
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                  </div>
                )}

                <button
                  onClick={handleCloseScanner}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium ${
                    academicMode
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                  }`}
                >
                  关闭
                </button>
              </div>
            )}

            {showResult && diagnosisResult && !errorMessage && (
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${academicMode ? 'text-slate-900' : 'text-zinc-100'}`}>
                    <Target className="w-5 h-5 text-blue-500" />
                    逻辑链路诊断报告
                  </h3>
                  <button
                    onClick={handleCloseScanner}
                    className={`p-1 rounded ${academicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-800'}`}
                  >
                    <X className={`w-5 h-5 ${academicMode ? 'text-slate-500' : 'text-zinc-400'}`} />
                  </button>
                </div>

                <div className={`p-4 rounded-lg mb-4 ${academicMode ? 'bg-blue-50 border border-blue-200' : 'bg-blue-900/20 border border-blue-500/30'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className={`w-4 h-4 ${academicMode ? 'text-blue-600' : 'text-blue-400'}`} />
                    <span className={`font-bold ${academicMode ? 'text-blue-700' : 'text-blue-400'}`}>
                      {diagnosisResult.targetName}
                    </span>
                  </div>
                  <p className={`text-xs ${academicMode ? 'text-blue-600' : 'text-blue-400/80'}`}>
                    {diagnosisResult.mapName} - 教研权值: {diagnosisResult.motifWeight} (基础分)
                  </p>
                </div>

                {diagnosisResult.motifCoordinate && (
                  <div className={`p-4 rounded-lg mb-4 ${academicMode ? 'bg-purple-50 border border-purple-200' : 'bg-purple-900/20 border border-purple-500/30'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className={`w-4 h-4 ${academicMode ? 'text-purple-600' : 'text-purple-400'}`} />
                      <span className={`font-bold text-sm ${academicMode ? 'text-purple-700' : 'text-purple-400'}`}>
                        母题坐标定位
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className={academicMode ? 'text-purple-600' : 'text-purple-400/80'}>所属母题</span>
                        <span className={`font-bold ${academicMode ? 'text-purple-700' : 'text-purple-300'}`}>
                          {diagnosisResult.motifCoordinate.motifName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={academicMode ? 'text-purple-600' : 'text-purple-400/80'}>当前状态</span>
                        <span className={`font-mono ${academicMode ? 'text-purple-700' : 'text-purple-300'}`}>
                          {diagnosisResult.motifCoordinate.currentLevel} · ELO {diagnosisResult.motifCoordinate.currentElo}
                        </span>
                      </div>
                      {diagnosisResult.motifCoordinate.matchedWeapons && diagnosisResult.motifCoordinate.matchedWeapons.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-700">
                          <span className={academicMode ? 'text-purple-600' : 'text-purple-400/80'}>匹配武器：</span>
                          <div className="mt-1 space-y-1">
                            {diagnosisResult.motifCoordinate.matchedWeapons.map((w, idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <span className={`font-medium ${academicMode ? 'text-purple-700' : 'text-purple-300'}`}>
                                  {w.weaponName}
                                </span>
                                <span className={`text-xs ${academicMode ? 'text-purple-500' : 'text-purple-400/70'}`}>
                                  {w.matchedKeywords.slice(0, 2).join(', ')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className={`p-4 rounded-lg mb-4 ${academicMode ? 'bg-slate-100' : 'bg-zinc-800'}`}>
                  <h4 className={`text-sm font-bold mb-3 ${academicMode ? 'text-slate-700' : 'text-zinc-200'}`}>
                    诊断结果
                  </h4>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={academicMode ? 'text-slate-600' : 'text-zinc-400'}>检测到逻辑点</span>
                      <span className={`font-bold ${academicMode ? 'text-slate-800' : 'text-zinc-200'}`}>{diagnosisResult.totalPoints} 个</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={academicMode ? 'text-slate-600' : 'text-zinc-400'}>攻克逻辑点</span>
                      <span className="font-bold text-emerald-500">{diagnosisResult.conqueredPoints} 个</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={academicMode ? 'text-slate-600' : 'text-zinc-400'}>计分规则</span>
                      <span className={`font-bold ${academicMode ? 'text-slate-800' : 'text-zinc-200'}`}>
                        按节点难度梯度 (L2:40/L3:60/L4:100)
                      </span>
                    </div>
                    <div className={`border-t pt-2 mt-2 ${academicMode ? 'border-slate-200' : 'border-zinc-700'}`}>
                      <div className="mb-2">
                        <span className={`text-xs ${academicMode ? 'text-slate-500' : 'text-zinc-500'}`}>得分明细：</span>
                        <div className="space-y-1 mt-1">
                          {diagnosisResult.pointBreakdown?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className={academicMode ? 'text-slate-600' : 'text-zinc-400'}>
                                {item.level} · {item.name}
                              </span>
                              <span className={`font-bold ${item.level === 'L4' ? 'text-amber-500' : item.level === 'L3' ? 'text-purple-500' : 'text-blue-500'}`}>
                                +{item.value} 分
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {diagnosisResult.l4Bonus > 0 && (
                        <div className="flex justify-between mt-1 pt-1 border-t border-dashed">
                          <span className={academicMode ? 'text-slate-600' : 'text-zinc-400'}>L4 首次突破奖</span>
                          <span className="font-bold text-amber-500 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />+{diagnosisResult.l4Bonus} 分
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between mt-2 pt-2 border-t border-dashed">
                        <span className={`font-bold ${academicMode ? 'text-slate-700' : 'text-zinc-300'}`}>本次获得</span>
                        <span className={`font-bold text-lg ${academicMode ? 'text-blue-600' : 'text-blue-400'}`}>
                          +{diagnosisResult.cappedEloGain} 分
                          {diagnosisResult.isCapped && (
                            <span className="text-xs ml-1 text-amber-500">(已封顶)</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {diagnosisResult.hasRedRemaining && (
                  <div className={`p-4 rounded-lg mb-4 ${academicMode ? 'bg-red-50 border border-red-200' : 'bg-red-900/20 border border-red-500/30'}`}>
                    <div className="flex items-start gap-3">
                      <Lock className={`w-5 h-5 mt-0.5 ${academicMode ? 'text-red-500' : 'text-red-400'}`} />
                      <div>
                        <p className={`font-bold ${academicMode ? 'text-red-700' : 'text-red-400'}`}>
                          等级晋升已锁定
                        </p>
                        <p className={`text-sm mt-1 ${academicMode ? 'text-red-600' : 'text-red-400/80'}`}>
                          {diagnosisResult.message}
                        </p>
                        <p className={`text-xs mt-2 ${academicMode ? 'text-red-500' : 'text-red-400/70'}`}>
                          Elo 可继续上涨，但等级图标和称号保持锁定，直到所有红色变例被攻克。
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {!diagnosisResult.hasRedRemaining && (
                  <div className={`p-4 rounded-lg mb-4 ${academicMode ? 'bg-emerald-50 border border-emerald-200' : 'bg-emerald-900/20 border border-emerald-500/30'}`}>
                    <div className="flex items-start gap-3">
                      <span className={`w-5 h-5 mt-0.5 ${academicMode ? 'text-emerald-500' : 'text-emerald-400'}`}>✓</span>
                      <div>
                        <p className={`font-bold ${academicMode ? 'text-emerald-700' : 'text-emerald-400'}`}>
                          逻辑链路已闭环!
                        </p>
                        <p className={`text-sm mt-1 ${academicMode ? 'text-emerald-600' : 'text-emerald-400/80'}`}>
                          所有变例已攻克，等级晋升通道已解锁!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleCloseScanner}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${
                      academicMode
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                    }`}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleConfirmDiagnosis}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold ${
                      diagnosisResult.hasRedRemaining
                        ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/25'
                        : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25'
                    }`}
                  >
                    {diagnosisResult.hasRedRemaining ? '确认诊断结果' : '确认并领取奖励'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default BattleScanner
