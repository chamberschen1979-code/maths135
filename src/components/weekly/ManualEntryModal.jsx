import React, { useState, useCallback, useEffect } from 'react';
import { useUserProgress } from '../../context/UserProgressContext';
import { generateUserQuestionId } from '../../utils/questionStateManager';
import { aiFillFullRagFields, getVariationNames } from '../../utils/aiFillUtils';
import LatexRenderer from '../LatexRenderer';

const MOTIF_LIST = [
  { id: 'M01', name: '集合、逻辑用语与复数' },
  { id: 'M02', name: '不等式' },
  { id: 'M03', name: '函数概念与性质' },
  { id: 'M04', name: '指对数函数与运算' },
  { id: 'M05', name: '平面向量' },
  { id: 'M06', name: '三角函数' },
  { id: 'M07', name: '立体几何' },
  { id: 'M08', name: '数列' },
  { id: 'M09', name: '概率与统计' },
  { id: 'M10', name: '解析几何' },
  { id: 'M11', name: '空间向量' },
  { id: 'M12', name: '导数基础' },
  { id: 'M13', name: '圆锥曲线' },
  { id: 'M14', name: '导数进阶' },
  { id: 'M15', name: '排列组合' },
  { id: 'M16', name: '二项式定理' },
  { id: 'M17', name: '数学归纳法' }
];

const ManualEntryModal = ({ 
  isOpen, 
  onClose, 
  initialMotifId,
  initialSpecId,
  initialVarId,
  initialMotifName,
  initialQuestion,
  initialLevel,
  isAcademicMode,
  onEntrySuccess
}) => {
  const { addToUserPool, removeFromUserPool, userPool } = useUserProgress();
  
  const [selectedMotif, setSelectedMotif] = useState(initialMotifId || 'M04');
  const [selectedSpec, setSelectedSpec] = useState(initialSpecId || 'V1');
  const [selectedVar, setSelectedVar] = useState(initialVarId || '1.1');
  
  const [formData, setFormData] = useState({
    problem: initialQuestion || '',
    answer: '',
    keyPoints: '',
    level: initialLevel || 'L3'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAiFilling, setIsAiFilling] = useState(false);
  const [ragData, setRagData] = useState(null);
  const [lastAddedId, setLastAddedId] = useState(null);
  const [showUndo, setShowUndo] = useState(false);
  const [entrySuccess, setEntrySuccess] = useState(false);
  const [locationNames, setLocationNames] = useState({ specName: '', varName: '' });

  useEffect(() => {
    if (initialMotifId) setSelectedMotif(initialMotifId);
    if (initialSpecId) setSelectedSpec(initialSpecId);
    if (initialVarId) setSelectedVar(initialVarId);
    if (initialQuestion) setFormData(prev => ({ ...prev, problem: initialQuestion }));
    if (initialLevel) setFormData(prev => ({ ...prev, level: initialLevel }));
  }, [initialMotifId, initialSpecId, initialVarId, initialQuestion, initialLevel]);

  useEffect(() => {
    const loadNames = async () => {
      if (selectedMotif && selectedSpec && selectedVar) {
        const names = await getVariationNames(selectedMotif, selectedSpec, selectedVar);
        setLocationNames(names);
      }
    };
    loadNames();
  }, [selectedMotif, selectedSpec, selectedVar]);

  const selectedMotifName = MOTIF_LIST.find(m => m.id === selectedMotif)?.name || initialMotifName || '';

  const handleAiFillRagFields = useCallback(async () => {
    if (!formData.problem.trim()) {
      alert('请先填写题目内容');
      return;
    }
    
    setIsAiFilling(true);
    
    try {
      const userPoolIds = (userPool || []).map(q => q.id);
      
      const result = await aiFillFullRagFields(
        formData.problem,
        selectedMotif,
        selectedMotifName,
        selectedSpec,
        selectedVar,
        formData.level,
        userPoolIds
      );
      
      if (result) {
        setRagData(result);
        
        setFormData(prev => ({
          ...prev,
          answer: result.answer || prev.answer,
          keyPoints: result.key_points ? result.key_points.join('\n') : prev.keyPoints
        }));
        
        if (result.specName && result.varName) {
          setLocationNames({
            specName: result.specName,
            varName: result.varName
          });
        }
        
      } else {
        alert('AI补全失败，请手动填写');
      }
    } catch (error) {
      console.error('[AI填充] 失败:', error);
      alert('AI填充失败，请手动填写');
    } finally {
      setIsAiFilling(false);
    }
  }, [formData.problem, formData.level, selectedMotif, selectedMotifName, selectedSpec, selectedVar, userPool]);

  const handleSubmit = useCallback(() => {
    if (!formData.problem.trim() || !formData.answer.trim()) {
      alert('请填写题目和答案');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const questionId = ragData?.id || generateUserQuestionId(selectedMotif);
      
      const newQuestion = {
        id: questionId,
        data_source: ragData?.data_source || 'error_import',
        source: ragData?.source || '错题导入',
        problem: formData.problem.trim(),
        answer: formData.answer.trim(),
        key_points: formData.keyPoints
          .split('\n')
          .map(k => k.trim())
          .filter(k => k.length > 0),
        level: formData.level,
        tags: ragData?.tags || [formData.level, selectedMotifName],
        quality_score: ragData?.quality_score || 80,
        meta: ragData?.meta || {
          core_logic: [],
          trap_tags: [],
          weapons: [],
          strategy_hint: ''
        },
        specId: selectedSpec,
        specName: locationNames.specName || ragData?.specName || '',
        varId: selectedVar,
        varName: locationNames.varName || ragData?.varName || '',
        analysis: ragData?.analysis || '',
        motifId: selectedMotif,
        motifName: selectedMotifName,
        addedAt: new Date().toISOString(),
        addedBy: 'user'
      };
      
      addToUserPool(newQuestion);
      setLastAddedId(questionId);
      setEntrySuccess(true);
      setShowUndo(true);
      
      if (onEntrySuccess) {
        onEntrySuccess(questionId);
      }
      
    } catch (error) {
      console.error('[ManualEntry] 入库失败:', error);
      alert('入库失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, selectedMotif, selectedSpec, selectedVar, selectedMotifName, ragData, locationNames, addToUserPool, onEntrySuccess]);

  const handleUndo = useCallback(() => {
    if (lastAddedId) {
      removeFromUserPool(lastAddedId);
      setLastAddedId(null);
      setShowUndo(false);
      setEntrySuccess(false);
    }
  }, [lastAddedId, removeFromUserPool]);

  const handleClose = useCallback(() => {
    setFormData({
      problem: '',
      answer: '',
      keyPoints: '',
      level: 'L3'
    });
    setRagData(null);
    setEntrySuccess(false);
    setShowUndo(false);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const displaySpecName = locationNames.specName || ragData?.specName || '';
  const displayVarName = locationNames.varName || ragData?.varName || '';

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className={`w-full max-w-lg rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto ${
        isAcademicMode ? 'bg-white' : 'bg-zinc-800'
      }`}>
        <div className={`flex items-center justify-between p-4 border-b sticky top-0 ${
          isAcademicMode ? 'bg-white border-slate-200' : 'bg-zinc-800 border-zinc-700'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">📥</span>
            <h3 className={`font-bold text-lg ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
              错题入库
            </h3>
          </div>
          <button
            onClick={handleClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isAcademicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-700'
            }`}
          >
            ✕
          </button>
        </div>
        
        {entrySuccess ? (
          <div className="p-6 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h4 className={`text-lg font-bold mb-2 ${isAcademicMode ? 'text-slate-800' : 'text-zinc-100'}`}>
              入库成功！
            </h4>
            <p className={`text-sm mb-4 ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
              题目已添加到您的个人题库
            </p>
            {showUndo && (
              <button
                onClick={handleUndo}
                className="px-4 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                撤回
              </button>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className={`p-3 rounded-lg ${
              isAcademicMode ? 'bg-slate-50 border border-slate-200' : 'bg-zinc-700 border border-zinc-600'
            }`}>
              <div className={`text-xs font-medium mb-2 ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                📍 位置信息
              </div>
              <div className={`text-sm ${isAcademicMode ? 'text-slate-700' : 'text-zinc-300'}`}>
                {selectedMotifName || initialMotifName}
                {displaySpecName && ` → ${displaySpecName}`}
                {displayVarName && ` → ${displayVarName}`}
                {!displaySpecName && selectedSpec && ` → ${selectedSpec}`}
                {!displayVarName && selectedVar && ` → ${selectedVar}`}
              </div>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isAcademicMode ? 'text-slate-700' : 'text-zinc-300'
              }`}>
                题目 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.problem}
                onChange={(e) => setFormData({...formData, problem: e.target.value})}
                className={`w-full border rounded-lg p-3 text-sm transition-all ${
                  isAcademicMode 
                    ? 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                    : 'bg-zinc-700 border-zinc-600 text-zinc-100 focus:ring-2 focus:ring-blue-500'
                }`}
                rows={4}
                placeholder="输入题目内容，支持 LaTeX 格式"
              />
              {formData.problem && (
                <div className={`mt-2 p-2 rounded-lg border ${
                  isAcademicMode ? 'bg-slate-50 border-slate-200' : 'bg-zinc-700 border-zinc-600'
                }`}>
                  <div className={`text-xs mb-1 ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>预览：</div>
                  <div className={`text-sm ${isAcademicMode ? 'text-slate-800' : 'text-zinc-200'}`}>
                    <LatexRenderer content={formData.problem} />
                  </div>
                </div>
              )}
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isAcademicMode ? 'text-slate-700' : 'text-zinc-300'
              }`}>
                答案 <span className="text-red-500">*</span>
              </label>
              <input
                value={formData.answer}
                onChange={(e) => setFormData({...formData, answer: e.target.value})}
                className={`w-full border rounded-lg p-3 text-sm transition-all ${
                  isAcademicMode 
                    ? 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                    : 'bg-zinc-700 border-zinc-600 text-zinc-100 focus:ring-2 focus:ring-blue-500'
                }`}
                placeholder="输入答案"
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                isAcademicMode ? 'text-slate-700' : 'text-zinc-300'
              }`}>
                解析要点（每行一个）
              </label>
              <textarea
                value={formData.keyPoints}
                onChange={(e) => setFormData({...formData, keyPoints: e.target.value})}
                className={`w-full border rounded-lg p-3 text-sm transition-all ${
                  isAcademicMode 
                    ? 'bg-white border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                    : 'bg-zinc-700 border-zinc-600 text-zinc-100 focus:ring-2 focus:ring-blue-500'
                }`}
                rows={3}
                placeholder="① 分析...\n② 求解...\n③ 验证..."
              />
            </div>
            
            <div className="flex items-center gap-2">
              <label className={`text-sm font-medium ${
                isAcademicMode ? 'text-slate-700' : 'text-zinc-300'
              }`}>
                难度：
              </label>
              {['L2', 'L3', 'L4'].map(level => (
                <button
                  key={level}
                  onClick={() => setFormData({...formData, level})}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    formData.level === level
                      ? 'bg-blue-500 text-white'
                      : isAcademicMode
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            
            {ragData && (
              <div className={`p-3 rounded-lg border ${
                isAcademicMode ? 'bg-purple-50 border-purple-200' : 'bg-purple-900/20 border-purple-800'
              }`}>
                <div className={`text-xs font-medium mb-2 ${
                  isAcademicMode ? 'text-purple-600' : 'text-purple-400'
                }`}>
                  ✨ AI 已补全以下 RAG 字段：
                </div>
                <div className={`text-xs space-y-1 ${
                  isAcademicMode ? 'text-purple-700' : 'text-purple-300'
                }`}>
                  <div><strong>编号 (id)：</strong>{ragData.id}</div>
                  <div><strong>来源 (data_source)：</strong>{ragData.data_source}</div>
                  {ragData.tags && ragData.tags.length > 0 && (
                    <div><strong>标签 (tags)：</strong>{ragData.tags.join(', ')}</div>
                  )}
                  {ragData.meta?.core_logic && ragData.meta.core_logic.length > 0 && (
                    <div><strong>核心逻辑 (meta.core_logic)：</strong>{ragData.meta.core_logic.join(', ')}</div>
                  )}
                  {ragData.meta?.trap_tags && ragData.meta.trap_tags.length > 0 && (
                    <div><strong>易错点 (meta.trap_tags)：</strong>{ragData.meta.trap_tags.join(', ')}</div>
                  )}
                  {ragData.meta?.weapons && ragData.meta.weapons.length > 0 && (
                    <div><strong>杀手锏 (meta.weapons)：</strong>{ragData.meta.weapons.join(', ')}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {!entrySuccess && (
          <div className={`flex justify-end gap-2 p-4 border-t ${
            isAcademicMode ? 'bg-slate-50 border-slate-200' : 'bg-zinc-800 border-zinc-700'
          }`}>
            <button
              onClick={handleAiFillRagFields}
              disabled={!formData.problem.trim() || isAiFilling}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isAcademicMode 
                  ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' 
                  : 'bg-purple-900/30 text-purple-400 hover:bg-purple-900/50'
              }`}
            >
              {isAiFilling ? (
                <>
                  <span className="animate-spin inline-block mr-1">⏳</span>
                  AI 补全中...
                </>
              ) : (
                <>✨ AI补全RAG字段</>
              )}
            </button>
            <button
              onClick={handleClose}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                isAcademicMode ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
              }`}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.problem.trim() || !formData.answer.trim() || isSubmitting}
              className="px-4 py-2 rounded-lg text-sm bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>入库中...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>确认入库</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManualEntryModal;
