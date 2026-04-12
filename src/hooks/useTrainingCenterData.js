import { useMemo } from 'react';
import { getLevelByElo, LEVEL_THRESHOLDS, LEVEL_INITIAL_ELO } from '../utils/eloEngine';
import { addLegacyIdsToMotifData } from '../utils/migrateDataStructure';

const motifModules = import.meta.glob('/src/data/M*.json', { eager: true });

const getMotifData = (motifId) => {
  const key = `/src/data/${motifId}.json`
  const rawData = motifModules[key]?.default
  if (!rawData) return null
  return addLegacyIdsToMotifData(rawData)
}

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
        stats: { totalElo: 0, level: 'L1', meltdownCount: 0, masteredCount: 0, totalCount: 0 },
        progressTree: [],
        hasMeltdown: false
      };
    }

    const allEncounters = tacticalData.tactical_maps.flatMap(map => map.encounters || []);
    
    let meltdownCount = 0;
    let masteredCount = 0;
    let totalCount = 0;
    const topicsMap = new Map();

    allEncounters.forEach(encounter => {
      const motifId = encounter.target_id;
      const elo = encounter.elo_score || 800
      const level = getLevelByElo(elo);

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

      const detailedMotif = getMotifData(motifId);

      if (!detailedMotif?.specialties) {
        console.warn(`[ProgressTree] 母题 ${motifId} 暂无新结构数据 (specialties)，已跳过`);
        return
      }

      const motifName = detailedMotif.motif_name || encounter.target_name || motifId;

      const savedSpecialties = encounter.specialties || []
      const savedBenchmarkMap = new Map()
      savedSpecialties.forEach(spec => {
        spec.variations?.forEach(v => {
          v.master_benchmarks?.forEach(b => {
            savedBenchmarkMap.set(b.id || `${spec.spec_id}_${v.var_id}_${b.level}`, {
              is_mastered: b.is_mastered,
              consecutive_correct: b.consecutive_correct,
              l2_status: b.l2_status
            })
          })
        })
      })

      const l2Green = elo >= 1800
      const l3Green = elo >= 2500
      const l4Green = elo >= 3000
      const l2Red = elo >= 1001 && elo < 1800
      const l3Red = elo >= 1801 && elo < 2500
      const l4Red = elo >= 2501 && elo < 3000

      let motifTotalBenchmarks = 0;
      let motifMasteredBenchmarks = 0;
      const renderedSpecialties = [];

      detailedMotif.specialties.forEach(spec => {
        if (!spec.variations) return

        const renderedVariants = [];

        spec.variations.forEach(variation => {
          const pool = variation.original_pool || [];

          const levelStatuses = {
            L2: { exists: pool.some(q => q.level === 'L2'), isMastered: l2Green, isLocked: l2Red },
            L3: { exists: pool.some(q => q.level === 'L3'), isMastered: l3Green, isLocked: l3Red },
            L4: { exists: pool.some(q => q.level === 'L4'), isMastered: l4Green, isLocked: l4Red }
          };

          const variantTotal = Object.values(levelStatuses).filter(s => s.exists).length;
          const variantMastered = Object.values(levelStatuses).filter(s => s.exists && s.isMastered).length;

          motifTotalBenchmarks += variantTotal;
          motifMasteredBenchmarks += variantMastered;
          totalCount += variantTotal;
          masteredCount += variantMastered;

          if (l2Red || l3Red || l4Red) meltdownCount++;

          renderedVariants.push({
            varId: `${spec.spec_id}_${variation.var_id}`,
            varName: variation.name,
            levelStatuses,
            variantTotal,
            variantMastered
          });
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

    const activatedEncounters = allEncounters.filter(e => (e.elo_score || LEVEL_INITIAL_ELO.L1) >= 1001);
    const avgElo = activatedEncounters.length > 0 
      ? Math.round(activatedEncounters.reduce((sum, e) => sum + (e.elo_score || LEVEL_INITIAL_ELO.L1), 0) / activatedEncounters.length)
      : LEVEL_INITIAL_ELO.L1;
    const userLevel = getLevelByElo(avgElo);

    let variationPassCount = 0;
    topicsMap.forEach(topic => {
      topic.motifs.forEach(motif => {
        const allVariants = motif.variants || [];
        if (allVariants.length > 0 && allVariants.every(v => v.variantMastered === v.variantTotal)) {
          variationPassCount++;
        }
      });
    });

    return {
      stats: {
        totalElo: avgElo,
        level: userLevel,
        meltdownCount,
        masteredCount,
        totalCount,
        variationPassCount,
        variationTotalCount: [...topicsMap.values()].reduce((sum, t) => sum + t.motifs.reduce((s, m) => s + (m.variants?.length || 0), 0), 0)
      },
      progressTree,
      hasMeltdown: meltdownCount > 0
    };
  }, [tacticalData, errorNotebook]);
};

export default useTrainingCenterData;
