import React, { useState, useMemo } from 'react';
import { RotateCcw, CheckCircle, XCircle, Clock, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { resetQuestionHistory, getDaysSince } from '../../utils/questionHistoryUtils';
import LatexRenderer from '../LatexRenderer';

const QuestionHistoryPanel = ({
  questionHistory,
  setQuestionHistory,
  isAcademicMode
}) => {
  const [filter, setFilter] = useState('all');
  const [expandedKey, setExpandedKey] = useState(null);

  const stats = useMemo(() => {
    const entries = Object.entries(questionHistory);
    return {
      total: entries.length,
      mastered: entries.filter(([, e]) => e.isMastered).length,
      reset: entries.filter(([, e]) => e.isReset).length,
      neverAnswered: entries.filter(([, e]) => !e.lastAnsweredAt).length
    };
  }, [questionHistory]);

  const filteredEntries = useMemo(() => {
    const entries = Object.entries(questionHistory).map(([key, entry]) => ({ key, ...entry }));
    
    switch (filter) {
      case 'mastered':
        return entries.filter(e => e.isMastered);
      case 'not_mastered':
        return entries.filter(e => !e.isMastered && e.lastAnsweredAt);
      case 'reset':
        return entries.filter(e => e.isReset);
      case 'never_answered':
        return entries.filter(e => !e.lastAnsweredAt);
      default:
        return entries;
    }
  }, [questionHistory, filter]);

  const handleReset = (key) => {
    if (setQuestionHistory) {
      setQuestionHistory(prev => resetQuestionHistory(prev, key));
    }
  };

  const toggleExpand = (key) => {
    setExpandedKey(expandedKey === key ? null : key);
  };

  const getStatusBadge = (entry) => {
    if (entry.isReset) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
          <RotateCcw size={12} /> 已重置
        </span>
      );
    }
    if (entry.isMastered) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
          <CheckCircle size={12} /> 已掌握
        </span>
      );
    }
    if (entry.lastAnsweredAt) {
      const daysSince = getDaysSince(entry.lastAnsweredAt);
      if (daysSince >= 7) {
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">
            <Clock size={12} /> {daysSince}天前
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">
          <XCircle size={12} /> 未掌握
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
        未答题
      </span>
    );
  };

  const truncateText = (text, maxLength = 80) => {
    if (!text) return '暂无题干';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const QuestionTextPreview = ({ text, maxLength, expanded }) => {
    const displayText = truncateText(text, maxLength);
    if (!text) return <span className="text-gray-400">暂无题干</span>;
    
    if (expanded) {
      return <LatexRenderer content={text} />;
    }
    
    const hasLatex = text.includes('$');
    if (hasLatex) {
      return <LatexRenderer content={displayText} />;
    }
    
    return <span>{displayText}</span>;
  };

  if (stats.total === 0) {
    return (
      <div className={`p-4 rounded-lg ${isAcademicMode ? 'bg-white' : 'bg-zinc-800'}`}>
        <h3 className="text-lg font-semibold mb-2">📋 出题历史</h3>
        <p className={`text-sm ${isAcademicMode ? 'text-gray-500' : 'text-zinc-400'}`}>
          暂无出题记录，开始练习后会自动记录
        </p>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg ${isAcademicMode ? 'bg-white' : 'bg-zinc-800'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">📋 出题历史</h3>
        <div className="flex items-center gap-2">
          <Filter size={16} className={isAcademicMode ? 'text-gray-400' : 'text-zinc-400'} />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`text-sm px-2 py-1 rounded ${
              isAcademicMode 
                ? 'bg-gray-100 text-gray-700 border-gray-200' 
                : 'bg-zinc-700 text-zinc-200 border-zinc-600'
            } border`}
          >
            <option value="all">全部 ({stats.total})</option>
            <option value="mastered">已掌握 ({stats.mastered})</option>
            <option value="not_mastered">未掌握 ({stats.total - stats.mastered - stats.neverAnswered})</option>
            <option value="reset">已重置 ({stats.reset})</option>
            <option value="never_answered">未答题 ({stats.neverAnswered})</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4 text-center">
        <div className={`p-2 rounded ${isAcademicMode ? 'bg-gray-50' : 'bg-zinc-700'}`}>
          <div className="text-xl font-bold">{stats.total}</div>
          <div className={`text-xs ${isAcademicMode ? 'text-gray-500' : 'text-zinc-400'}`}>总出题</div>
        </div>
        <div className={`p-2 rounded ${isAcademicMode ? 'bg-green-50' : 'bg-green-900/30'}`}>
          <div className="text-xl font-bold text-green-600">{stats.mastered}</div>
          <div className={`text-xs ${isAcademicMode ? 'text-gray-500' : 'text-zinc-400'}`}>已掌握</div>
        </div>
        <div className={`p-2 rounded ${isAcademicMode ? 'bg-red-50' : 'bg-red-900/30'}`}>
          <div className="text-xl font-bold text-red-600">{stats.total - stats.mastered - stats.neverAnswered}</div>
          <div className={`text-xs ${isAcademicMode ? 'text-gray-500' : 'text-zinc-400'}`}>未掌握</div>
        </div>
        <div className={`p-2 rounded ${isAcademicMode ? 'bg-blue-50' : 'bg-blue-900/30'}`}>
          <div className="text-xl font-bold text-blue-600">{stats.reset}</div>
          <div className={`text-xs ${isAcademicMode ? 'text-gray-500' : 'text-zinc-400'}`}>已重置</div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2">
        {filteredEntries.slice(0, 30).map((entry) => (
          <div
            key={entry.key}
            className={`rounded ${
              isAcademicMode ? 'bg-gray-50' : 'bg-zinc-700'
            }`}
          >
            <div 
              className="flex items-start justify-between p-3 cursor-pointer"
              onClick={() => toggleExpand(entry.key)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{entry.motifName || entry.motifId}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    entry.level === 'L4' ? 'bg-purple-100 text-purple-700' :
                    entry.level === 'L3' ? 'bg-orange-100 text-orange-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {entry.level}
                  </span>
                  {getStatusBadge(entry)}
                  {expandedKey === entry.key ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
                
                <div className={`text-xs mt-1 ${isAcademicMode ? 'text-gray-500' : 'text-zinc-400'}`}>
                  {entry.specName && <span>专项: {entry.specName}</span>}
                  {entry.varName && <span className="ml-2">变例: {entry.varName}</span>}
                  <span className="ml-2">出题{entry.issueCount}次</span>
                  {entry.lastGrade && <span className="ml-2">评级: {entry.lastGrade}</span>}
                </div>
                
                <div className={`text-sm mt-2 ${isAcademicMode ? 'text-gray-600' : 'text-zinc-300'}`}>
                  <QuestionTextPreview 
                    text={entry.questionText} 
                    maxLength={expandedKey === entry.key ? 500 : 60}
                    expanded={expandedKey === entry.key}
                  />
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset(entry.key);
                }}
                className={`ml-2 p-1.5 rounded transition-colors flex-shrink-0 ${
                  isAcademicMode 
                    ? 'hover:bg-gray-200 text-gray-500 hover:text-blue-600' 
                    : 'hover:bg-zinc-600 text-zinc-400 hover:text-blue-400'
                }`}
                title="重置此题（重置后相当于没出过）"
              >
                <RotateCcw size={14} />
              </button>
            </div>
            
            {expandedKey === entry.key && (
              <div className={`px-3 pb-3 border-t ${isAcademicMode ? 'border-gray-200' : 'border-zinc-600'}`}>
                <div className={`text-xs mt-2 grid grid-cols-2 gap-2 ${isAcademicMode ? 'text-gray-500' : 'text-zinc-400'}`}>
                  <div>题目ID: {entry.questionId}</div>
                  <div>母题ID: {entry.motifId}</div>
                  <div>首次出题: {entry.firstIssuedAt ? new Date(entry.firstIssuedAt).toLocaleDateString() : '-'}</div>
                  <div>最近出题: {entry.lastIssuedAt ? new Date(entry.lastIssuedAt).toLocaleDateString() : '-'}</div>
                  {entry.lastAnsweredAt && (
                    <>
                      <div>最近答题: {new Date(entry.lastAnsweredAt).toLocaleDateString()}</div>
                      <div>连续正确: {entry.consecutiveCorrect || 0}次</div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredEntries.length > 30 && (
          <div className={`text-center py-2 text-sm ${isAcademicMode ? 'text-gray-400' : 'text-zinc-400'}`}>
            还有 {filteredEntries.length - 30} 条记录...
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionHistoryPanel;
