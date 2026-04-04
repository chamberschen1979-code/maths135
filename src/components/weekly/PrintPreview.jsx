import React, { useRef } from 'react';
import LatexRenderer from '../LatexRenderer';

const PrintPreview = ({
  tasks,
  isOpen,
  onClose,
  isAcademicMode
}) => {
  const printRef = useRef();

  if (!isOpen || !tasks || tasks.length === 0) return null;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('请允许弹出窗口以进行打印');
      return;
    }

    const tasksHtml = tasks.map((task, index) => {
      let question = task.variant?.question || task.problem || task.question || '';
      
      console.log('[PrintPreview] 题目', index + 1, '原始内容:', question.substring(0, 100));
      console.log('[PrintPreview] 题目', index + 1, '转义下划线:', question.match(/\\_+/g));
      console.log('[PrintPreview] 题目', index + 1, '普通下划线:', question.match(/_+/g));
      
      const parts = question.split(/(\$[^$]+\$)/g);
      question = parts.map(part => {
        if (part.startsWith('$') && part.endsWith('$')) {
          return part;
        }
        part = part.replace(/(\\_)+/g, function(match) {
          const count = match.length / 2;
          return '<span class="blank-line" style="display:inline-block;width:' + (count * 8) + 'px;border-bottom:1px solid #333;height:1em;"></span>';
        });
        part = part.replace(/_{2,}/g, function(match) {
          return '<span class="blank-line" style="display:inline-block;width:' + (match.length * 8) + 'px;border-bottom:1px solid #333;height:1em;"></span>';
        });
        return part;
      }).join('');
      
      return `
        <div class="task">
          <div class="task-header">
            <div class="task-number">${index + 1}</div>
            <div class="task-meta">
              ${task.motifName || task.motifId}
              ${task.specName ? ` · ${task.specName}` : ''}
              ${task.varName ? ` · ${task.varName}` : ''}
            </div>
          </div>
          <div class="task-content">${question}</div>
          <div class="answer-area">
            <div class="answer-label">答题区：</div>
          </div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>周度任务 - 打印版</title>
          <script>
            window.MathJax = {
              tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']]
              },
              svg: {
                fontCache: 'global'
              },
              startup: {
                pageReady: function() {
                  return MathJax.startup.defaultPageReady().then(function() {
                    setTimeout(function() {
                      window.print();
                    }, 500);
                  });
                }
              }
            };
          </script>
          <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js" async></script>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'SimSun', 'Songti SC', serif;
              padding: 20mm;
              max-width: 210mm;
              margin: 0 auto;
              background: white;
              color: black;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .header h1 {
              font-size: 24px;
              margin: 0 0 10px 0;
            }
            .header .info {
              font-size: 14px;
              color: #666;
            }
            .task {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .task-header {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 10px;
            }
            .task-number {
              width: 24px;
              height: 24px;
              border: 1px solid #333;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
            }
            .task-meta {
              font-size: 12px;
              color: #666;
            }
            .task-content {
              line-height: 1.8;
              font-size: 14px;
            }
            .answer-area {
              margin-top: 20px;
              border: 1px dashed #ccc;
              min-height: 180px;
              padding: 10px;
            }
            .answer-label {
              font-size: 12px;
              color: #999;
              margin-bottom: 5px;
            }
            @media print {
              body { padding: 15mm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>每周使命 - 训练任务</h1>
            <div class="info">
              生成时间: ${new Date().toLocaleDateString('zh-CN')} | 
              题目数量: ${tasks.length} 道
            </div>
          </div>
          ${tasksHtml}
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl ${
        isAcademicMode ? 'bg-white' : 'bg-zinc-800'
      }`}>
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-inherit">
          <h2 className="font-bold text-lg">打印预览</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
            >
              🖨️ 打印
            </button>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm ${
                isAcademicMode ? 'hover:bg-slate-100' : 'hover:bg-zinc-700'
              }`}
            >
              关闭
            </button>
          </div>
        </div>

        <div ref={printRef} className="p-6 pt-0">
          <div className="sticky top-0 z-10 -mx-6 px-6 py-4 bg-inherit" style={{ background: isAcademicMode ? '#fff' : '#27272a' }}>
            <div className="text-center pb-4 border-b-2 border-slate-300">
              <h1 className="text-xl font-bold">每周任务 - 训练任务</h1>
              <p className={`text-sm mt-2 ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                生成时间: {new Date().toLocaleDateString('zh-CN')} | 题目数量: {tasks.length} 道
              </p>
            </div>
          </div>
          <div className="mt-4">

          {tasks.map((task, index) => (
            <div key={task.id || index} className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isAcademicMode ? 'bg-slate-200' : 'bg-zinc-700'
                }`}>
                  {index + 1}
                </span>
                <span className={`text-xs ${isAcademicMode ? 'text-slate-500' : 'text-zinc-400'}`}>
                  {task.motifName || task.motifId}
                  {task.specName ? ` · ${task.specName}` : ''}
                  {task.varName ? ` · ${task.varName}` : ''}
                </span>
              </div>
              <div className={`text-sm leading-relaxed ${
                isAcademicMode ? 'text-slate-700' : 'text-zinc-300'
              }`}>
                <LatexRenderer content={task.variant?.question || task.problem || task.question || ''} />
              </div>
              <div className={`mt-4 p-4 border border-dashed min-h-[180px] ${
                isAcademicMode ? 'border-slate-300' : 'border-zinc-600'
              }`}>
                <span className={`text-xs ${isAcademicMode ? 'text-slate-400' : 'text-zinc-500'}`}>
                  答题区：
                </span>
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPreview;
