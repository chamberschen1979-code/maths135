import { useMemo } from 'react';
import { getLevelByElo, LEVEL_THRESHOLDS, LEVEL_INITIAL_ELO } from '../utils/eloEngine';

import M01Data from '../data/M01.json';
import M02Data from '../data/M02.json';
import M03Data from '../data/M03.json';
import M04Data from '../data/M04.json';
import M05Data from '../data/M05.json';
import M06Data from '../data/M06.json';
import M07Data from '../data/M07.json';
import M08Data from '../data/M08.json';
import M09Data from '../data/M09.json';
import M10Data from '../data/M10.json';
import M11Data from '../data/M11.json';
import M12Data from '../data/M12.json';
import M13Data from '../data/M13.json';
import M14Data from '../data/M14.json';
import M15Data from '../data/M15.json';
import M16Data from '../data/M16.json';
import M17Data from '../data/M17.json';

const MOTIF_DATA_MAP = {
  'M01': M01Data,
  'M02': M02Data,
  'M03': M03Data,
  'M04': M04Data,
  'M05': M05Data,
  'M06': M06Data,
  'M07': M07Data,
  'M08': M08Data,
  'M09': M09Data,
  'M10': M10Data,
  'M11': M11Data,
  'M12': M12Data,
  'M13': M13Data,
  'M14': M14Data,
  'M15': M15Data,
  'M16': M16Data,
  'M17': M17Data,
};

const MOTIF_TO_TOPIC = {
  'M01': { topicId: 'T01', topicName: '集合与逻辑' },
  'M02': { topicId: 'T02', topicName: '不等式' },
  'M03': { topicId: 'T03', topicName: '函数' },
  'M04': { topicId: 'T03', topicName: '函数' },
  'M11': { topicId: 'T03', topicName: '函数' },
  'M14': { topicId: 'T03', topicName: '函数' },
  'M05': { topicId: 'T04', topicName: '向量' },
  'M06': { topicId: 'T05', topicName: '三角函数' },
  'M07': { topicId: 'T05', topicName: '三角函数' },
  'M08': { topicId: 'T06', topicName: '数列' },
  'M15': { topicId: 'T06', topicName: '数列' },
  'M09': { topicId: 'T07', topicName: '立体几何' },
  'M10': { topicId: 'T08', topicName: '解析几何' },
  'M13': { topicId: 'T08', topicName: '解析几何' },
  'M12': { topicId: 'T09', topicName: '概率统计' },
  'M16': { topicId: 'T10', topicName: '计数原理' },
  'M17': { topicId: 'T11', topicName: '创新思维' },
};

export const useTrainingCenterData = (tacticalData, errorNotebook = []) => {
  return useMemo(() => {
    if (!tacticalData?.tactical_maps) {
      return {
        stats: { totalElo: 0, level: 'L1', meltdownCount: 0, nearCompleteCount: 0, masteredCount: 0, totalCount: 0 },
        criticalAlerts: [],
        recommendedNext: [],
        progressTree: [],
        hasMeltdown: false
      };
    }

    const allEncounters = tacticalData.tactical_maps.flatMap(map => map.encounters || []);
    
    let totalElo = 0;
    let meltdownCount = 0;
    let nearCompleteCount = 0;
    let masteredCount = 0;
    let totalCount = 0;
    const criticalAlerts = [];
    const recommendedNext = [];
    const topicsMap = new Map();

    allEncounters.forEach(encounter => {
      const motifId = encounter.target_id;
      const elo = encounter.elo_score || LEVEL_INITIAL_ELO.L1;
      const level = getLevelByElo(elo);
      totalElo += elo;

      const topicInfo = MOTIF_TO_TOPIC[motifId] || { topicId: 'T00', topicName: '其他' };
      
      if (!topicsMap.has(topicInfo.topicId)) {
        topicsMap.set(topicInfo.topicId, {
          topicId: topicInfo.topicId,
          topicName: topicInfo.topicName,
          progress: 0,
          hasMeltdown: false,
          motifs: []
        });
      }
      const topic = topicsMap.get(topicInfo.topicId);

      const detailedMotif = MOTIF_DATA_MAP[motifId];
      
      if (!detailedMotif?.specialties) {
        console.warn(`[ProgressTree] 母题 ${motifId} 暂无新结构数据 (specialties)，已跳过`);
        return;
      }

      const motifName = detailedMotif.motif_name || encounter.target_name || motifId;
      
      let motifTotalBenchmarks = 0;
      let motifMasteredBenchmarks = 0;
      const renderedSpecialties = [];

      detailedMotif.specialties.forEach(spec => {
        if (!spec.variations) return;

        const renderedVariants = [];

        spec.variations.forEach(variation => {
          const benchmarks = variation.master_benchmarks || [];
          
          const levelBenchmarks = {
            L2: benchmarks.filter(b => b.level === 'L2')[0] || null,
            L3: benchmarks.filter(b => b.level === 'L3')[0] || null,
            L4: benchmarks.filter(b => b.level === 'L4')[0] || null
          };

          let variantMastered = 0;
          let variantTotal = 0;
          const levelStatuses = {};

          ['L2', 'L3', 'L4'].forEach(lvl => {
            const b = levelBenchmarks[lvl];
            if (b) {
              variantTotal++;
              motifTotalBenchmarks++;
              totalCount++;
              
              if (b.is_mastered === true) {
                variantMastered++;
                motifMasteredBenchmarks++;
                masteredCount++;
              }
              
              const isLocked = b.is_locked || b.l2_status === 'RED';
              const streak = b.consecutive_correct || 0;
              
              levelStatuses[lvl] = {
                exists: true,
                isMastered: b.is_mastered === true,
                streak,
                isLocked
              };
              
              if (isLocked) {
                meltdownCount++;
                criticalAlerts.push({
                  type: 'meltdown',
                  topicId: topicInfo.topicId,
                  topicName: topicInfo.topicName,
                  motifId,
                  motifName,
                  varId: `${spec.spec_id}_${variation.var_id}`,
                  varName: variation.name,
                  specName: spec.spec_name,
                  level: lvl,
                  isLocked: true,
                  l2Status: 'RED'
                });
              }
              
              if (streak >= 1 && streak < 3 && !isLocked) {
                nearCompleteCount++;
                recommendedNext.push({
                  type: 'nearComplete',
                  topicId: topicInfo.topicId,
                  topicName: topicInfo.topicName,
                  motifId,
                  motifName,
                  varId: `${spec.spec_id}_${variation.var_id}`,
                  varName: variation.name,
                  specName: spec.spec_name,
                  level: lvl,
                  streak,
                  remaining: 3 - streak,
                  levelStatuses
                });
              }
            } else {
              levelStatuses[lvl] = { exists: false };
            }
          });

          if (variantTotal > 0) {
            renderedVariants.push({
              varId: `${spec.spec_id}_${variation.var_id}`,
              varName: variation.name,
              levelStatuses,
              variantTotal,
              variantMastered
            });
          }
        });

        if (renderedVariants.length > 0) {
          renderedSpecialties.push({
            specId: spec.spec_id,
            specName: spec.spec_name,
            variants: renderedVariants
          });
        }
      });

      const motifProgress = motifTotalBenchmarks > 0 ? motifMasteredBenchmarks / motifTotalBenchmarks : 0;

      topic.motifs.push({
        motifId,
        motifName,
        topicName: topicInfo.topicName,
        elo,
        level,
        progress: motifProgress,
        masteredCount: motifMasteredBenchmarks,
        totalCount: motifTotalBenchmarks,
        hasMeltdown: false,
        specialties: renderedSpecialties
      });
    });

    topicsMap.forEach(topic => {
      let total = 0;
      let mastered = 0;
      topic.motifs.forEach(motif => {
        total += motif.totalCount;
        mastered += motif.masteredCount;
      });
      topic.progress = total > 0 ? mastered / total : 0;
    });

    const progressTree = allEncounters.map(encounter => {
      const motifId = encounter.target_id;
      const topic = topicsMap.get(MOTIF_TO_TOPIC[motifId]?.topicId);
      return topic?.motifs.find(m => m.motifId === motifId);
    }).filter(Boolean);

    recommendedNext.sort((a, b) => b.streak - a.streak);

    if (recommendedNext.length === 0) {
      const activatedVariants = [];
      
      allEncounters.forEach(encounter => {
        const motifId = encounter.target_id;
        const elo = encounter.elo_score || LEVEL_INITIAL_ELO.L1;
        
        if (elo < 1001) return;
        
        const detailedMotif = MOTIF_DATA_MAP[motifId];
        if (!detailedMotif?.specialties) return;
        
        const motifName = detailedMotif.motif_name || encounter.target_name || motifId;
        const topicInfo = MOTIF_TO_TOPIC[motifId] || { topicId: 'T00', topicName: '其他' };
        
        detailedMotif.specialties.forEach(spec => {
          spec.variations?.forEach(variation => {
            const benchmarks = variation.master_benchmarks || [];
            const levelStatuses = {};
            
            ['L2', 'L3', 'L4'].forEach(lvl => {
              const b = benchmarks.find(bb => bb.level === lvl);
              if (b) {
                levelStatuses[lvl] = {
                  exists: true,
                  isMastered: b.is_mastered === true,
                  streak: b.consecutive_correct || 0,
                  isLocked: b.is_locked || b.l2_status === 'RED'
                };
              }
            });
            
            ['L2', 'L3', 'L4'].forEach(lvl => {
              const b = benchmarks.find(bb => bb.level === lvl);
              if (b && !b.is_mastered) {
                activatedVariants.push({
                  type: 'fallback',
                  topicId: topicInfo.topicId,
                  topicName: topicInfo.topicName,
                  motifId,
                  motifName,
                  varId: `${spec.spec_id}_${variation.var_id}`,
                  varName: variation.name,
                  specName: spec.spec_name,
                  level: lvl,
                  streak: b.consecutive_correct || 0,
                  remaining: 3 - (b.consecutive_correct || 0),
                  levelStatuses
                });
              }
            });
          });
        });
      });
      
      activatedVariants.sort((a, b) => {
        const levelOrder = { L2: 1, L3: 2, L4: 3 };
        return (levelOrder[a.level] || 99) - (levelOrder[b.level] || 99);
      });
      
      recommendedNext.push(...activatedVariants.slice(0, 2));
    }

    const activatedEncounters = allEncounters.filter(e => (e.elo_score || LEVEL_INITIAL_ELO.L1) >= 1001);
    const avgElo = activatedEncounters.length > 0 
      ? Math.round(activatedEncounters.reduce((sum, e) => sum + (e.elo_score || LEVEL_INITIAL_ELO.L1), 0) / activatedEncounters.length)
      : LEVEL_INITIAL_ELO.L1;
    const userLevel = getLevelByElo(avgElo);

    console.log('[ProgressTree] ✅ 今日推荐:', recommendedNext.length, '项');

    return {
      stats: {
        totalElo: avgElo,
        level: userLevel,
        meltdownCount,
        nearCompleteCount,
        masteredCount,
        totalCount
      },
      criticalAlerts,
      recommendedNext: recommendedNext.slice(0, 5),
      progressTree,
      hasMeltdown: meltdownCount > 0
    };
  }, [tacticalData, errorNotebook]);
};

export default useTrainingCenterData;
