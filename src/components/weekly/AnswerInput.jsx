import React, { useState } from 'react';

const AnswerInput = ({
  task,
  onSubmit,
  isAcademicMode
}) => {
  const [answer, setAnswer] = useState(task?.userAnswer || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit?.(answer);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScanUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowScanner(true);
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('taskId', task?.id);

    try {
      const res = await fetch('/api/ocr-answer', {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.answer) {
          setAnswer(data.answer);
        }
      }
    } catch (err) {
      console.error('OCR failed:', err);
    } finally {
      setShowScanner(false);
    }
  };

  return (
    <div className={`mt-3 p-3 rounded-lg ${
      isAcademicMode ? 'bg-slate-100' : 'bg-zinc-800'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold">答案录入</span>
        <div className="flex gap-2">
          <label className={`px-2 py-1 rounded text-xs cursor-pointer ${
            isAcademicMode 
              ? 'bg-white border border-slate-200 hover:border-blue-300' 
              : 'bg-zinc-700 border border-zinc-600 hover:border-blue-500'
          }`}>
            📷 扫描录入
            <input
              type="file"
              accept="image/*"
              onChange={handleScanUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="请输入答案..."
        className={`w-full p-2 rounded-lg text-sm resize-none ${
          isAcademicMode 
            ? 'bg-white border border-slate-200 focus:border-blue-400' 
            : 'bg-zinc-700 border border-zinc-600 focus:border-blue-500'
        }`}
        rows={4}
      />

      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={() => setAnswer('')}
          className={`px-3 py-1 rounded text-xs ${
            isAcademicMode ? 'hover:bg-slate-200' : 'hover:bg-zinc-700'
          }`}
        >
          清空
        </button>
        <button
          onClick={handleSubmit}
          disabled={!answer.trim() || isSubmitting}
          className={`px-4 py-1 rounded text-xs font-medium text-white ${
            !answer.trim() || isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600'
          }`}
        >
          {isSubmitting ? '提交中...' : '提交答案'}
        </button>
      </div>

      {showScanner && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-xl ${
            isAcademicMode ? 'bg-white' : 'bg-zinc-800'
          }`}>
            <div className="flex items-center gap-2">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>正在识别答案...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnswerInput;
