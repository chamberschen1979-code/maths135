import { useState, useContext, useRef, useCallback, useEffect } from 'react'
import { Camera, Upload, X, Scan, AlertTriangle, Target, Sparkles, Lock, MapPin, Crop, FileText, Scissors, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react'
import { ThemeContext } from '../App'
import tacticalMapsData from '../data/tacticalMaps.json'
import weaponDetails from '../data/weapon_details.json'
import ReactCrop from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

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
  'S-GEO': 'M09',
  'S-ANA': 'M10',
  'S-DER': 'M11',
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
  'M10': '圆锥曲线基础',
  'M11': '导数工具基础',
  'M12': '概率与统计综合',
  'M13': '解析几何综合压轴',
  'M14': '导数综合压轴',
  'M15': '数列综合压轴',
  'M16': '计数原理与二项式',
  'M17': '创新思维与情境',
}

const WEAPON_NAMES = {
  'S-SET-01': '空集优先讨论',
  'S-SET-02': '集合运算化简',
  'S-SET-03': '韦恩图分析',
  'S-FUNC-01': '定义域优先',
  'S-FUNC-02': '同增异减法则',
  'S-FUNC-03': '奇偶性判断',
  'S-FUNC-04': '零点交点转化',
  'S-FUNC-05': '数形结合分析',
  'S-TRIG-01': '恒等变换技巧',
  'S-TRIG-02': '图象变换铁律',
  'S-TRIG-03': '五点作图法',
  'S-TRIG-04': 'ω范围讨论',
  'S-TRIG-05': '辅助角公式',
  'S-VEC-01': '基底法',
  'S-VEC-02': '坐标法',
  'S-VEC-03': '几何意义',
  'S-VEC-04': '建系策略',
  'S-VEC-05': '数量积应用',
  'S-SEQ-01': '下标和性质',
  'S-SEQ-02': '错位相减',
  'S-SEQ-03': '裂项相消',
  'S-SEQ-04': '分组求和',
  'S-SEQ-05': '通项公式',
  'S-GEO-01': '建系坐标法',
  'S-GEO-02': '几何法',
  'S-GEO-03': '体积转化',
  'S-GEO-04': '空间向量',
  'S-GEO-05': '二面角计算',
  'S-ANA-01': '设点求参',
  'S-ANA-02': '韦达定理',
  'S-ANA-03': '点差法',
  'S-ANA-04': '切线方程',
  'S-ANA-05': '轨迹方程',
  'S-DER-01': '求导法则',
  'S-DER-02': '切线方程',
  'S-DER-03': '单调性讨论',
  'S-DER-04': '极值最值',
  'S-DER-05': '零点讨论',
  'S-PROB-01': '古典概型',
  'S-PROB-02': '条件概率',
  'S-PROB-03': '期望方差',
  'S-PROB-04': '分布列',
  'S-PROB-05': '统计推断'
}

const WEAPON_KEYWORDS = {
  'S-SET-01': ['空集', '子集', '包含', 'A⊆B'],
  'S-SET-02': ['交集', '并集', '补集', '集合运算'],
  'S-SET-03': ['韦恩图', '集合关系'],
  'S-FUNC-01': ['定义域', '值域', '有意义'],
  'S-FUNC-02': ['单调性', '复合函数', '同增异减'],
  'S-FUNC-03': ['奇函数', '偶函数', '对称'],
  'S-FUNC-04': ['零点', '交点', '根'],
  'S-FUNC-05': ['数形结合', '图像'],
  'S-TRIG-01': ['恒等变换', '诱导公式', '倍角'],
  'S-TRIG-02': ['图象变换', '平移', '伸缩'],
  'S-TRIG-03': ['五点作图', '图象'],
  'S-TRIG-04': ['ω范围', '周期', '单调区间'],
  'S-TRIG-05': ['辅助角公式', '最值', '振幅'],
  'S-VEC-01': ['基底', '向量分解'],
  'S-VEC-02': ['坐标', '向量运算'],
  'S-VEC-03': ['几何意义', '投影'],
  'S-VEC-04': ['建系', '坐标系'],
  'S-VEC-05': ['数量积', '夹角', '垂直'],
  'S-SEQ-01': ['等差', '等比', '下标'],
  'S-SEQ-02': ['错位相减', '求和'],
  'S-SEQ-03': ['裂项', '相消'],
  'S-SEQ-04': ['分组', '求和'],
  'S-SEQ-05': ['通项', '递推'],
  'S-GEO-01': ['建系', '坐标'],
  'S-GEO-02': ['几何法', '证明'],
  'S-GEO-03': ['体积', '等体积'],
  'S-GEO-04': ['空间向量', '法向量'],
  'S-GEO-05': ['二面角', '夹角'],
  'S-ANA-01': ['设点', '参数'],
  'S-ANA-02': ['韦达定理', '根与系数'],
  'S-ANA-03': ['点差法', '中点'],
  'S-ANA-04': ['切线', '切点'],
  'S-ANA-05': ['轨迹', '方程'],
  'S-DER-01': ['求导', '导数'],
  'S-DER-02': ['切线', '切点'],
  'S-DER-03': ['单调性', '增减'],
  'S-DER-04': ['极值', '最值'],
  'S-DER-05': ['零点', '根'],
  'S-PROB-01': ['古典概型', '等可能'],
  'S-PROB-02': ['条件概率', '贝叶斯'],
  'S-PROB-03': ['期望', '方差'],
  'S-PROB-04': ['分布', '随机变量'],
  'S-PROB-05': ['统计', '样本']
}

const findMatchingWeapons = (text) => {
  if (!text) return []
  
  const lowerText = text.toLowerCase()
  const matches = []
  
  Object.entries(WEAPON_KEYWORDS).forEach(([weaponId, keywords]) => {
    const keywordMatches = keywords.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    )
    if (keywordMatches.length > 0) {
      const categoryPrefix = weaponId.split('-').slice(0, 2).join('-')
      matches.push({
        weaponId,
        weaponName: WEAPON_NAMES[weaponId] || weaponId,
        categoryId: categoryPrefix,
        categoryName: getCategoryName(categoryPrefix),
        matchedKeywords: keywordMatches,
        motifId: CATEGORY_TO_MOTIF[categoryPrefix],
      })
    }
  })
  
  return matches.sort((a, b) => b.matchedKeywords.length - a.matchedKeywords.length)
}

const getCategoryName = (categoryId) => {
  const names = {
    'S-SET': '集合与逻辑',
    'S-FUNC': '函数与性质',
    'S-TRIG': '三角函数',
    'S-VEC': '平面向量',
    'S-SEQ': '数列',
    'S-GEO': '立体几何',
    'S-ANA': '解析几何',
    'S-DER': '导数',
    'S-PROB': '概率统计'
  }
  return names[categoryId] || '其他'
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

function BattleScanner({ onDiagnosisComplete, isAcademicMode, tacticalData, onRealDiagnosis, onImageCapture }) {
  const { isAcademicMode: contextMode } = useContext(ThemeContext)
  const academicMode = isAcademicMode ?? contextMode
  
  const [showScanner, setShowScanner] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  
  const [upImg, setUpImg] = useState(null)
  const [crop, setCrop] = useState({ unit: '%', x: 5, y: 5, width: 90, height: 90, aspect: 0 })
  const [completedCrop, setCompletedCrop] = useState(null)
  
  const [documentFile, setDocumentFile] = useState(null)
  const [documentType, setDocumentType] = useState(null)
  const [documentPages, setDocumentPages] = useState([])
  const [currentPage, setCurrentPage] = useState(0)
  const [documentScale, setDocumentScale] = useState(1.5)
  const [isDocumentLoading, setIsDocumentLoading] = useState(false)
  const [isFromCamera, setIsFromCamera] = useState(false)
  
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const imgRef = useRef(null)
  const previewCanvasRef = useRef(null)
  const documentCanvasRef = useRef(null)

  const onLoad = useCallback((e) => {
    imgRef.current = e.currentTarget
  }, [])

  const renderPDF = useCallback(async () => {
    if (!documentFile) return
    
    setIsDocumentLoading(true)
    try {
      const arrayBuffer = await documentFile.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const pages = []
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: documentScale })
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.width = viewport.width
        canvas.height = viewport.height
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise
        
        pages.push(canvas.toDataURL('image/png'))
      }
      
      setDocumentPages(pages)
      setCurrentPage(0)
    } catch (error) {
      console.error('PDF渲染失败:', error)
      setErrorMessage('PDF渲染失败，请尝试其他文件')
    }
    setIsDocumentLoading(false)
  }, [documentFile, documentScale])

  const renderWord = useCallback(async () => {
    if (!documentFile) return
    
    setIsDocumentLoading(true)
    try {
      const arrayBuffer = await documentFile.arrayBuffer()
      const result = await mammoth.convertToHtml({ arrayBuffer })
      
      const container = document.createElement('div')
      container.innerHTML = result.value
      container.style.padding = '20px'
      container.style.maxWidth = '100%'
      container.style.fontFamily = 'serif'
      container.style.fontSize = '14px'
      container.style.lineHeight = '1.6'
      
      document.body.appendChild(container)
      
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      const range = document.createRange()
      range.selectNodeContents(container)
      const rects = range.getClientRects()
      
      const width = container.scrollWidth
      const height = container.scrollHeight
      
      canvas.width = width * 2
      canvas.height = height * 2
      context.scale(2, 2)
      
      context.fillStyle = 'white'
      context.fillRect(0, 0, width, height)
      
      const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="padding: 20px; font-family: serif; font-size: 14px;">
            ${result.value}
          </div>
        </foreignObject>
      </svg>`
      
      const img = new Image()
      img.onload = () => {
        context.drawImage(img, 0, 0)
        setDocumentPages([canvas.toDataURL('image/png')])
        document.body.removeChild(container)
      }
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
      
    } catch (error) {
      console.error('Word渲染失败:', error)
      setErrorMessage('Word渲染失败，请尝试其他文件')
    }
    setIsDocumentLoading(false)
  }, [documentFile])

  useEffect(() => {
    if (documentFile && documentType === 'pdf') {
      renderPDF()
    } else if (documentFile && documentType === 'word') {
      renderWord()
    }
  }, [documentFile, documentType, documentScale, renderPDF, renderWord])

  const handleDocumentScreenshot = () => {
    if (documentPages.length === 0) return
    
    setUpImg(documentPages[currentPage])
    setCrop({ unit: '%', x: 5, y: 5, width: 90, height: 90, aspect: 0 })
    setCompletedCrop(null)
    setCapturedImage(null)
    setErrorMessage(null)
    setDocumentFile(null)
    setDocumentType(null)
    setDocumentPages([])
    setIsFromCamera(false)
  }

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    const isWord = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                   file.type === 'application/msword' ||
                   file.name.toLowerCase().endsWith('.docx') ||
                   file.name.toLowerCase().endsWith('.doc')
    
    if (isPDF) {
      setDocumentFile(file)
      setDocumentType('pdf')
      setDocumentPages([])
      setCurrentPage(0)
      setIsFromCamera(false)
      return
    }
    
    if (isWord) {
      setDocumentFile(file)
      setDocumentType('word')
      setDocumentPages([])
      setCurrentPage(0)
      setIsFromCamera(false)
      return
    }
    
    if (!file.type.startsWith('image/')) {
      setErrorMessage('请上传图片、PDF 或 Word 文件')
      return
    }
    
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const base64Data = e.target?.result
      if (base64Data) {
        setUpImg(base64Data)
        setCrop({ unit: '%', x: 5, y: 5, width: 90, height: 90, aspect: 0 })
        setCompletedCrop(null)
        setCapturedImage(null)
        setErrorMessage(null)
        setIsFromCamera(false)
      }
    }
    
    reader.onerror = () => {
      setErrorMessage('图片读取失败，请重试')
    }
    
    reader.readAsDataURL(file)
  }

  const handleCameraUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const base64Data = e.target?.result
      if (base64Data) {
        setUpImg(base64Data)
        setCrop({ unit: '%', x: 5, y: 5, width: 90, height: 90, aspect: 0 })
        setCompletedCrop(null)
        setCapturedImage(null)
        setErrorMessage(null)
        setIsFromCamera(true)
      }
    }
    
    reader.onerror = () => {
      setErrorMessage('图片读取失败，请重试')
    }
    
    reader.readAsDataURL(file)
  }

  const handleConfirmCrop = () => {
    if (!completedCrop || !upImg) {
      if (upImg) {
        if (onImageCapture) {
          onImageCapture(upImg)
        }
        resetAllState()
      }
      return
    }
    
    const img = imgRef.current
    if (!img || !(img instanceof HTMLImageElement)) {
      if (upImg && onImageCapture) {
        onImageCapture(upImg)
      }
      resetAllState()
      return
    }
    
    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height
    
    const cropX = completedCrop.x * scaleX
    const cropY = completedCrop.y * scaleY
    const cropWidth = completedCrop.width * scaleX
    const cropHeight = completedCrop.height * scaleY
    
    if (cropWidth <= 0 || cropHeight <= 0) {
      if (upImg && onImageCapture) {
        onImageCapture(upImg)
      }
      resetAllState()
      return
    }
    
    const canvas = document.createElement('canvas')
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
    if (onImageCapture) {
      onImageCapture(croppedBase64)
    }
    resetAllState()
  }

  const handleSkipCrop = () => {
    if (upImg && onImageCapture) {
      onImageCapture(upImg)
    }
    resetAllState()
  }

  const handleCameraCapture = () => {
    cameraInputRef.current?.click()
  }

  const resetAllState = () => {
    setShowScanner(false)
    setCapturedImage(null)
    setErrorMessage(null)
    setUpImg(null)
    setCompletedCrop(null)
    setDocumentFile(null)
    setDocumentType(null)
    setDocumentPages([])
    setCurrentPage(0)
    setIsFromCamera(false)
  }

  const handleCloseScanner = () => {
    resetAllState()
  }

  const handleBackToUpload = () => {
    setUpImg(null)
    setCompletedCrop(null)
    setCapturedImage(null)
    setErrorMessage(null)
    setDocumentFile(null)
    setDocumentType(null)
    setDocumentPages([])
    setCurrentPage(0)
    setIsFromCamera(false)
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
            {!upImg && !documentFile && (
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
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCameraUpload}
                    className="hidden"
                  />
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
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
                    <span className="font-medium">从相册选择 / 上传文档</span>
                  </button>
                </div>

                <div className={`mt-6 p-3 rounded-lg ${academicMode ? 'bg-amber-50 border border-amber-200' : 'bg-amber-900/20 border border-amber-500/30'}`}>
                  <p className={`text-xs ${academicMode ? 'text-amber-600' : 'text-amber-400'}`}>
                    💡 提示：拍照后需截图题目区域。PDF/Word 文件会先打开预览，再截图上传。
                  </p>
                </div>
              </div>
            )}

            {!upImg && documentFile && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${academicMode ? 'text-slate-900' : 'text-zinc-100'}`}>
                    <FileText className="w-5 h-5 text-blue-500" />
                    {documentType === 'pdf' ? 'PDF 文档' : 'Word 文档'}
                  </h3>
                  <button
                    onClick={handleBackToUpload}
                    className={`p-1 rounded ${academicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-800'}`}
                  >
                    <X className={`w-5 h-5 ${academicMode ? 'text-slate-500' : 'text-zinc-400'}`} />
                  </button>
                </div>

                <div className={`mb-4 p-3 rounded-lg ${academicMode ? 'bg-blue-50 border border-blue-200' : 'bg-blue-900/20 border border-blue-500/30'}`}>
                  <p className={`text-sm font-medium ${academicMode ? 'text-blue-700' : 'text-blue-300'}`}>
                    📄 {documentFile.name}
                  </p>
                </div>

                <div className={`mb-4 p-3 rounded-lg ${academicMode ? 'bg-amber-50 border border-amber-200' : 'bg-amber-900/20 border border-amber-500/30'}`}>
                  <p className={`text-sm ${academicMode ? 'text-amber-600' : 'text-amber-400'}`}>
                    ⚠️ PDF/Word 文件不能直接上传，请找到题目后点击"截图当前页"截取题目区域
                  </p>
                </div>

                {isDocumentLoading ? (
                  <div className={`p-8 text-center ${academicMode ? 'bg-slate-50' : 'bg-zinc-800'} rounded-lg mb-4`}>
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className={`text-sm ${academicMode ? 'text-slate-500' : 'text-zinc-400'}`}>正在渲染文档...</p>
                  </div>
                ) : documentPages.length > 0 ? (
                  <div className="mb-4">
                    <div className={`rounded-lg overflow-hidden border mb-2 ${academicMode ? 'border-slate-200' : 'border-zinc-700'}`}>
                      <img 
                        src={documentPages[currentPage]} 
                        alt={`第 ${currentPage + 1} 页`}
                        className="w-full max-h-[60vh] object-contain"
                      />
                    </div>
                    
                    {documentPages.length > 1 && (
                      <div className="flex items-center justify-between mb-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                          disabled={currentPage === 0}
                          className={`p-2 rounded-lg ${
                            currentPage === 0 
                              ? 'opacity-50 cursor-not-allowed' 
                              : academicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-700'
                          }`}
                        >
                          <ChevronLeft className={`w-5 h-5 ${academicMode ? 'text-slate-600' : 'text-zinc-400'}`} />
                        </button>
                        <span className={`text-sm ${academicMode ? 'text-slate-600' : 'text-zinc-400'}`}>
                          第 {currentPage + 1} / {documentPages.length} 页
                        </span>
                        <button
                          onClick={() => setCurrentPage(Math.min(documentPages.length - 1, currentPage + 1))}
                          disabled={currentPage === documentPages.length - 1}
                          className={`p-2 rounded-lg ${
                            currentPage === documentPages.length - 1 
                              ? 'opacity-50 cursor-not-allowed' 
                              : academicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-700'
                          }`}
                        >
                          <ChevronRight className={`w-5 h-5 ${academicMode ? 'text-slate-600' : 'text-zinc-400'}`} />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-center gap-2 mb-2">
                      <button
                        onClick={() => setDocumentScale(Math.max(0.5, documentScale - 0.25))}
                        className={`p-1.5 rounded ${academicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-700'}`}
                      >
                        <ZoomOut className={`w-4 h-4 ${academicMode ? 'text-slate-500' : 'text-zinc-400'}`} />
                      </button>
                      <span className={`text-xs ${academicMode ? 'text-slate-500' : 'text-zinc-500'}`}>
                        {Math.round(documentScale * 100)}%
                      </span>
                      <button
                        onClick={() => setDocumentScale(Math.min(3, documentScale + 0.25))}
                        className={`p-1.5 rounded ${academicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-700'}`}
                      >
                        <ZoomIn className={`w-4 h-4 ${academicMode ? 'text-slate-500' : 'text-zinc-400'}`} />
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <button
                    onClick={handleBackToUpload}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium ${
                      academicMode
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                    }`}
                  >
                    返回
                  </button>
                  <button
                    onClick={handleDocumentScreenshot}
                    disabled={documentPages.length === 0}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${
                      documentPages.length === 0
                        ? 'opacity-50 cursor-not-allowed bg-gray-400'
                        : academicMode
                          ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25'
                          : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25'
                    }`}
                  >
                    <Scissors className="w-4 h-4" />
                    截图当前页
                  </button>
                </div>
              </div>
            )}

            {upImg && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${academicMode ? 'text-slate-900' : 'text-zinc-100'}`}>
                    <Scissors className="w-5 h-5 text-blue-500" />
                    {isFromCamera ? '截图题目区域' : '裁剪题目区域'}
                  </h3>
                  <button
                    onClick={handleBackToUpload}
                    className={`p-1 rounded ${academicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-800'}`}
                  >
                    <X className={`w-5 h-5 ${academicMode ? 'text-slate-500' : 'text-zinc-400'}`} />
                  </button>
                </div>

                <p className={`text-sm mb-4 ${academicMode ? 'text-slate-600' : 'text-zinc-400'}`}>
                  {isFromCamera 
                    ? '框选题目区域，截图保存后开始 AI 诊断。'
                    : '拖动框选题目核心区域，过滤背景噪点以提高识别精度。'
                  }
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
                      style={{ maxHeight: '60vh', maxWidth: '100%' }}
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
                    {isFromCamera ? '使用原图' : '跳过裁剪'}
                  </button>
                  <button
                    onClick={handleConfirmCrop}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 ${
                      academicMode
                        ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25'
                        : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25'
                    }`}
                  >
                    <Scissors className="w-4 h-4" />
                    确认截图
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
