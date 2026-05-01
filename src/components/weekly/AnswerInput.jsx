import React, { useState, useRef } from 'react';
import { Camera, Type, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const LatexPreview = ({ text }) => {
  if (!text || !text.includes('$')) return null;
  
  try {
    const inlineRegex = /\$([^$\n]+?)\$/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = inlineRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, match.index)}</span>);
      }
      
      try {
        const html = katex.renderToString(match[1], { throwOnError: false });
        parts.push(<span key={`latex-${match.index}`} dangerouslySetInnerHTML={{ __html: html }} />);
      } catch {
        parts.push(<span key={`latex-${match.index}`} className="text-red-500">${match[1]}$</span>);
      }
      
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < text.length) {
      parts.push(<span key={`text-end`}>{text.substring(lastIndex)}</span>);
    }
    
    return <span className="text-indigo-600">{parts}</span>;
  } catch {
    return null;
  }
};

const AnswerInput = ({
  task,
  onSubmit,
  isAcademicMode
}) => {
  const [answer, setAnswer] = useState(task?.userAnswer || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputMode, setInputMode] = useState('text');
  const [selectedImage, setSelectedImage] = useState(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSubmit = async () => {
    if (inputMode === 'text' && !answer.trim()) return;
    if (inputMode === 'photo' && !selectedImage) return;
    
    setIsSubmitting(true);
    try {
      if (inputMode === 'text') {
        await onSubmit?.(answer, 'text');
      } else {
        await onSubmit?.(selectedImage, 'image');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const insertLatex = (latex) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const newText = answer.substring(0, start) + `$${latex}$` + answer.substring(end);
      setAnswer(newText);
      setTimeout(() => {
        textareaRef.current?.focus();
        const newPos = start + latex.length + 2;
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newPos;
      }, 0);
    }
  };

  const latexButtons = [
    { label: '分数', latex: '\\frac{a}{b}' },
    { label: '根号', latex: '\\sqrt{x}' },
    { label: '上标', latex: 'x^{2}' },
    { label: '下标', latex: 'x_{n}' },
    { label: '≥', latex: '\\geq' },
    { label: '≤', latex: '\\leq' },
    { label: '≠', latex: '\\neq' },
    { label: '∞', latex: '\\infty' },
    { label: 'π', latex: '\\pi' },
    { label: 'α', latex: '\\alpha' },
    { label: 'β', latex: '\\beta' },
    { label: 'θ', latex: '\\theta' },
  ];

  return (
    <div className={`mt-3 p-4 rounded-xl ${
      isAcademicMode ? 'bg-slate-50 border border-slate-200' : 'bg-zinc-800 border border-zinc-700'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-bold">答案录入</span>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setInputMode('text')}
          className={`flex-1 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all text-sm ${
            inputMode === 'text' 
              ? 'bg-indigo-600 text-white shadow-lg' 
              : isAcademicMode 
                ? 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200' 
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          <Type size={16} />
          ⌨️ 文本录入
        </button>
        <button
          onClick={() => setInputMode('photo')}
          className={`flex-1 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all text-sm ${
            inputMode === 'photo' 
              ? 'bg-indigo-600 text-white shadow-lg' 
              : isAcademicMode 
                ? 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200' 
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          <Camera size={16} />
          📷 拍照上传
        </button>
      </div>

      {inputMode === 'text' ? (
        <>
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {latexButtons.map((btn) => (
              <button
                key={btn.label}
                onClick={() => insertLatex(btn.latex)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-all ${
                  isAcademicMode 
                    ? 'bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700' 
                    : 'bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 text-zinc-300'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
          
          <textarea
            ref={textareaRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="请输入答案，支持 LaTeX 公式（如 $x^2$、$\\frac{1}{2}$）..."
            className={`w-full p-3 rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-100 outline-none ${
              isAcademicMode 
                ? 'bg-white border-2 border-slate-200 focus:border-indigo-400 text-slate-700' 
                : 'bg-zinc-700 border-2 border-zinc-600 focus:border-indigo-500 text-zinc-200 placeholder-zinc-500'
            }`}
            rows={4}
          />
          
          {answer.includes('$') && (
            <div className={`mt-2 p-2 rounded-lg text-sm ${
              isAcademicMode ? 'bg-indigo-50 border border-indigo-100' : 'bg-zinc-700 border border-zinc-600'
            }`}>
              <span className="text-xs text-slate-500 mr-2">预览:</span>
              <LatexPreview text={answer} />
            </div>
          )}
          
          <p className={`text-xs mt-2 ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`}>
            💡 提示：用 $...$ 包裹公式，如 $x^2 + y^2 = 1$
          </p>
        </>
      ) : (
        <>
          {selectedImage ? (
            <div className="relative mb-3">
              <img src={selectedImage} alt="上传的答案" className="w-full rounded-lg border-2 border-indigo-200 shadow-sm" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-all"
              >
                <XCircle size={16} />
              </button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                isAcademicMode 
                  ? 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-indigo-50' 
                  : 'border-zinc-600 hover:border-indigo-500 bg-zinc-700 hover:bg-zinc-600'
              }`}
            >
              <Camera className={`w-10 h-10 mb-3 ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`} />
              <p className={`font-medium ${isAcademicMode ? 'text-slate-600' : 'text-zinc-300'}`}>
                点击拍照或上传答案图片
              </p>
              <p className={`text-sm mt-1 ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`}>
                请确保字迹清晰
              </p>
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
        </>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => { setAnswer(''); setSelectedImage(null); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            isAcademicMode ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-zinc-700 text-zinc-400'
          }`}
        >
          清空
        </button>
        <button
          onClick={handleSubmit}
          disabled={(inputMode === 'text' && !answer.trim()) || (inputMode === 'photo' && !selectedImage) || isSubmitting}
          className={`px-5 py-2 rounded-lg text-sm font-bold text-white transition-all flex items-center gap-2 ${
            (inputMode === 'text' && !answer.trim()) || (inputMode === 'photo' && !selectedImage) || isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              提交中...
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              提交答案
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AnswerInput;
