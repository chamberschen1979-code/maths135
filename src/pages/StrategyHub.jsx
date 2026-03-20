import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Award, Lock } from 'lucide-react';
import KillerMoveCard from '../components/strategy/KillerMoveCard';
import CertificationExam from '../components/strategy/CertificationExam';
import InsightModal from '../components/strategy/InsightModal';
import strategyData from '../data/strategy_lib.json';
import { getStats } from '../utils/weaponProgress';

const StrategyHub = ({ onNavigate }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [examWeapon, setExamWeapon] = useState(null);
  const [insightWeapon, setInsightWeapon] = useState(null);

  const allWeapons = useMemo(() => {
    return strategyData.categories?.flatMap(c => c.weapons || []) || [];
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(allWeapons.map(w => w.category));
    return ['全部', ...Array.from(cats)];
  }, [allWeapons]);

  useEffect(() => {
    const highlight = searchParams.get('highlight')
    const autoOpen = searchParams.get('autoOpen')
    
    if (highlight) {
      const weapon = allWeapons.find(w => w.id === highlight)
      if (weapon) {
        if (autoOpen === 'learn') {
          setInsightWeapon(weapon)
        } else if (autoOpen === 'certify') {
          setExamWeapon(weapon)
        }
      }
      searchParams.delete('highlight')
      searchParams.delete('autoOpen')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, allWeapons])

  const filteredWeapons = useMemo(() => {
    return allWeapons.filter(weapon => {
      const matchCat = activeCategory === '全部' || weapon.category === activeCategory;
      const matchSearch = weapon.name.includes(searchQuery) || 
        (weapon.trigger_keywords && weapon.trigger_keywords.some(t => t.includes(searchQuery)));
      return matchCat && matchSearch;
    });
  }, [allWeapons, activeCategory, searchQuery]);

  const stats = useMemo(() => {
    const total = allWeapons.length;
    const certified = allWeapons.filter(w => w._userState?.status === 'CERTIFIED').length;
    const locked = allWeapons.filter(w => w._userState?.status === 'LOCKED').length;
    const progressStats = getStats();
    return { 
      total, 
      certified, 
      locked, 
      progress: total > 0 ? Math.round((certified / total) * 100) : 0,
      learned: progressStats.learned,
      totalPractices: progressStats.totalPractices
    };
  }, [allWeapons]);

  const handleStartCertification = (weapon) => {
    setExamWeapon(weapon);
  };

  const handleOpenInsight = (weapon) => {
    setInsightWeapon(weapon);
  };

  const handleCertificationComplete = (weaponId) => {
    alert("🎉 恭喜！认证通过，徽章已颁发！");
    setExamWeapon(null);
    window.location.reload(); 
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-20">
      
      {/* 头部统计区 */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <Award className="text-indigo-600 w-8 h-8" />
              杀手锏认证中心
            </h1>
            <p className="text-slate-500 mt-2">
              高中数学核心解题策略系统化整理 — 共 {stats.total} 招，已掌握 <span className="text-green-600 font-bold">{stats.certified}</span> 招
            </p>
          </div>
          
          {/* 进度条 */}
          <div className="w-full md:w-64 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
              <span>总进度</span>
              <span>{stats.progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000" 
                style={{ width: `${stats.progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 学习统计看板 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <div>
                <p className="text-2xl font-black text-blue-700">{stats.learned}</p>
                <p className="text-sm text-blue-600">已学习</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <div>
                <p className="text-2xl font-black text-green-700">{stats.certified}</p>
                <p className="text-sm text-green-600">已掌握</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl border border-purple-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⚔️</span>
              </div>
              <div>
                <p className="text-2xl font-black text-purple-700">{stats.totalPractices}</p>
                <p className="text-sm text-purple-600">总练习</p>
              </div>
            </div>
          </div>
        </div>

        {stats.learned === 0 && stats.certified === 0 && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200 mb-6 text-center">
            <p className="text-indigo-700 font-medium">
              🚀 开始你的第一个杀手锏学习吧！点击下方卡片的「要点」按钮开始。
            </p>
          </div>
        )}

        {/* 控制栏：搜索与分类 */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          {/* 搜索框 */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="搜索杀手锏名称或标签..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* 分类筛选 */}
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border
                  ${activeCategory === cat 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 卡片网格 */}
        {filteredWeapons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredWeapons.map(weapon => (
              <KillerMoveCard 
                key={weapon.id} 
                weapon={weapon} 
                onNavigate={onNavigate}
                onStartCertification={handleStartCertification}
                onOpenInsight={handleOpenInsight}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">没有找到匹配的杀手锏</p>
            <button 
              onClick={() => {setSearchQuery(''); setActiveCategory('全部');}}
              className="mt-4 text-indigo-600 font-medium hover:underline"
            >
              清除筛选
            </button>
          </div>
        )}
      </div>

      {/* 要点解析弹窗 */}
      <InsightModal 
        weapon={insightWeapon}
        isOpen={!!insightWeapon}
        onClose={() => setInsightWeapon(null)}
      />

      {/* 认证考试弹窗 */}
      {examWeapon && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
            <button 
              onClick={() => setExamWeapon(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full text-slate-600 hover:text-red-600 transition-colors"
            >
              ✕
            </button>
            <CertificationExam 
              weapon={examWeapon} 
              onComplete={handleCertificationComplete}
              onExit={() => setExamWeapon(null)}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default StrategyHub;
