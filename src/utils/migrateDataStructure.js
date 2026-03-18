/**
 * 数据结构迁移脚本：sub_targets → specialties
 * 
 * 功能：
 * 1. 为 M 系列文件的 master_benchmarks 生成 legacy_id
 * 2. 将旧 sub_targets 状态迁移到 specialties 结构
 * 3. 版本控制：schemaVersion 机制
 */

const SCHEMA_VERSION = 2;

export { SCHEMA_VERSION }

const LEVEL_INITIAL_ELO = {
  L1: 800,
  L2: 1000,
  L3: 1800,
  L4: 2500
};

const KEYWORD_MAPPINGS = {
  'M01': {
    '集合运算': ['V1', '1.1'],
    '逻辑用语': ['V1', '1.2'],
    '复数运算': ['V2', '2.1'],
    '集合综合': ['V1', '1.3'],
    '集合逻辑压轴': ['V1', '1.4']
  },
  'M02': {
    '不等式基本性质': ['V1', '1.1'],
    '一元二次不等式': ['V1', '1.2'],
    '不等式综合应用': ['V1', '1.3'],
    '不等式压轴': ['V1', '1.4']
  },
  'M03': {
    '函数定义域值域': ['V1', '1.1'],
    '函数单调性': ['V1', '1.2'],
    '函数奇偶性': ['V1', '1.3'],
    '函数性质综合': ['V1', '1.4'],
    '函数压轴': ['V1', '1.5']
  },
  'M04': {
    '指数运算': ['V1', '1.1'],
    '对数运算': ['V1', '1.2'],
    '指对数函数图像': ['V1', '1.3'],
    '指对数综合': ['V1', '1.4'],
    '指对数压轴': ['V1', '1.5']
  },
  'M05': {
    '向量线性运算': ['V1', '1.1'],
    '向量数量积': ['V1', '1.2'],
    '向量综合应用': ['V1', '1.3'],
    '向量压轴': ['V1', '1.4']
  },
  'M06': {
    '三角恒等变换': ['V1', '1.1'],
    '三角函数图像': ['V1', '1.2'],
    '三角函数综合': ['V1', '1.3'],
    '三角函数压轴': ['V1', '1.4']
  },
  'M07': {
    '正弦定理': ['V1', '1.1'],
    '余弦定理': ['V1', '1.2'],
    '解三角形综合': ['V1', '1.3'],
    '解三角形压轴': ['V1', '1.4']
  },
  'M08': {
    '等差数列': ['V1', '1.1'],
    '等比数列': ['V1', '1.2'],
    '数列求和': ['V1', '1.3'],
    '数列综合': ['V1', '1.4'],
    '数列压轴': ['V1', '1.5']
  },
  'M09': {
    '空间几何体': ['V1', '1.1'],
    '点线面位置关系': ['V1', '1.2'],
    '立体几何证明': ['V1', '1.3'],
    '立体几何压轴': ['V1', '1.4']
  },
  'M10': {
    '直线方程': ['V1', '1.1'],
    '圆的方程': ['V1', '1.2'],
    '直线与圆综合': ['V1', '1.3'],
    '解析几何压轴': ['V1', '1.4']
  },
  'M11': {
    '导数概念与运算': ['V1', '1.1'],
    '导数与切线': ['V1', '1.2'],
    '导数与单调性': ['V1', '1.3'],
    '导数与极值最值': ['V1', '1.4'],
    '导数综合应用': ['V1', '1.5']
  },
  'M12': {
    '古典概型': ['V1', '1.1'],
    '统计基础': ['V1', '1.2'],
    '概率统计综合': ['V1', '1.3'],
    '概率统计压轴': ['V1', '1.4']
  },
  'M13': {
    '圆锥曲线基础': ['V1', '1.1'],
    '圆锥曲线性质': ['V1', '1.2'],
    '解析几何大题': ['V1', '1.3']
  },
  'M14': {
    '导数基础回顾': ['V1', '1.1'],
    '导数证明技巧': ['V1', '1.2'],
    '导数压轴大题': ['V1', '1.3']
  },
  'M15': {
    '数列基础回顾': ['V1', '1.1'],
    '数列通项与求和进阶': ['V1', '1.2'],
    '数列压轴大题': ['V1', '1.3']
  },
  'M16': {
    '排列组合': ['V1', '1.1'],
    '二项式定理': ['V2', '2.1'],
    '计数综合': ['V1', '1.2'],
    '计数压轴': ['V1', '1.3']
  },
  'M17': {
    '创新题基础': ['V1', '1.1'],
    '新定义题': ['V1', '1.2'],
    '创新情境题': ['V1', '1.3']
  }
};

/**
 * 根据 sub_name 查找对应的 specialty 和 variation
 */
function findVariationBySubName(motifId, subName) {
  const mapping = KEYWORD_MAPPINGS[motifId];
  if (!mapping) return null;
  
  const variationKey = mapping[subName];
  if (!variationKey) {
    for (const [key, value] of Object.entries(mapping)) {
      if (subName.includes(key) || key.includes(subName)) {
        return value;
      }
    }
    return null;
  }
  return variationKey;
}

/**
 * 生成 legacy_id
 * 格式：M{ID}_L{Level}_{Index}
 */
function generateLegacyId(motifId, level, index) {
  return `${motifId}_${level}_${index}`;
}

/**
 * 为 M 系列文件的 master_benchmarks 添加 legacy_id
 */
export function addLegacyIdsToMotifData(motifData) {
  if (!motifData?.specialties) return motifData;
  
  const motifId = motifData.motif_id;
  const levelCounters = { L2: 0, L3: 0, L4: 0 };
  
  const updatedSpecialties = motifData.specialties.map(spec => {
    const updatedVariations = (spec.variations || []).map(v => {
      const updatedBenchmarks = (v.master_benchmarks || []).map(b => {
        const level = b.level;
        levelCounters[level]++;
        const legacyId = generateLegacyId(motifId, level, levelCounters[level]);
        
        return {
          ...b,
          legacy_id: legacyId,
          is_mastered: b.is_mastered,
          consecutive_correct: b.consecutive_correct,
          last_practice: b.last_practice || null
        };
      });
      
      return { ...v, master_benchmarks: updatedBenchmarks };
    });
    
    return { ...spec, variations: updatedVariations };
  });
  
  return {
    ...motifData,
    specialties: updatedSpecialties,
    schema_version: SCHEMA_VERSION
  };
}

/**
 * 迁移 encounter 数据：sub_targets → specialties
 */
export function migrateEncounterData(encounter, motifData) {
  const warnings = [];
  
  if (!encounter) return { data: encounter, warnings, migrated: false };
  
  if (encounter.schemaVersion >= SCHEMA_VERSION) {
    return { data: encounter, warnings, migrated: false };
  }
  
  const oldSubTargets = encounter.sub_targets || [];
  if (oldSubTargets.length === 0 && !encounter.specialties) {
    return { data: encounter, warnings, migrated: false };
  }
  
  let newSpecialties;
  
  if (motifData?.specialties) {
    newSpecialties = JSON.parse(JSON.stringify(motifData.specialties));
    
    const legacyIdMap = new Map();
    newSpecialties.forEach(spec => {
      spec.variations?.forEach(v => {
        v.master_benchmarks?.forEach(b => {
          if (b.legacy_id) {
            legacyIdMap.set(b.legacy_id, { spec, variation: v, benchmark: b });
          }
        });
      });
    });
    
    oldSubTargets.forEach(sub => {
      const legacyId = sub.sub_id;
      const found = legacyIdMap.get(legacyId);
      
      if (found) {
        const { benchmark } = found;
        benchmark.is_mastered = sub.is_mastered === true;
        benchmark.consecutive_correct = sub.consecutive_correct || 0;
        benchmark.last_practice = sub.last_practice || null;
        benchmark.l2_status = sub.l2_status || 'GREEN';
        benchmark.elo = LEVEL_INITIAL_ELO[sub.level_req] || LEVEL_INITIAL_ELO.L2;
      } else {
        warnings.push({
          type: 'LEGACY_ID_NOT_FOUND',
          sub_id: legacyId,
          sub_name: sub.sub_name,
          message: `未找到 legacy_id=${legacyId} 的对应节点`
        });
      }
    });
  } else {
    newSpecialties = buildSpecialtiesFromSubTargets(encounter);
  }
  
  const newEncounter = {
    ...encounter,
    specialties: newSpecialties,
    schemaVersion: SCHEMA_VERSION,
    elo_score: calculateInitialElo(newSpecialties)
  };
  
  delete newEncounter.sub_targets;
  
  return { data: newEncounter, warnings, migrated: true };
}

/**
 * 从 sub_targets 构建 specialties 结构（兜底方案）
 */
function buildSpecialtiesFromSubTargets(encounter) {
  const motifId = encounter.target_id;
  const subTargets = encounter.sub_targets || [];
  
  const levelGroups = { L2: [], L3: [], L4: [] };
  subTargets.forEach((sub, index) => {
    const level = sub.level_req || 'L2';
    if (levelGroups[level]) {
      levelGroups[level].push({ ...sub, index: index + 1 });
    }
  });
  
  const variations = [];
  Object.entries(levelGroups).forEach(([level, subs]) => {
    subs.forEach(sub => {
      variations.push({
        var_id: `auto_${level}_${sub.index}`,
        name: sub.sub_name,
        master_benchmarks: [{
          id: sub.sub_id,
          legacy_id: sub.sub_id,
          level: level,
          is_mastered: sub.is_mastered === true,
          consecutive_correct: sub.consecutive_correct || 0,
          last_practice: sub.last_practice || null,
          l2_status: sub.l2_status || 'GREEN',
          elo: LEVEL_INITIAL_ELO[level]
        }]
      });
    });
  });
  
  return [{
    spec_id: 'V_AUTO',
    spec_name: '自动迁移',
    variations
  }];
}

/**
 * 根据 specialties 计算初始 Elo
 */
function calculateInitialElo(specialties) {
  let hasMastered = { L2: false, L3: false, L4: false };
  
  specialties?.forEach(spec => {
    spec.variations?.forEach(v => {
      v.master_benchmarks?.forEach(b => {
        if (b.is_mastered) {
          hasMastered[b.level] = true;
        }
      });
    });
  });
  
  if (hasMastered.L4) return LEVEL_INITIAL_ELO.L4;
  if (hasMastered.L3) return LEVEL_INITIAL_ELO.L3;
  if (hasMastered.L2) return LEVEL_INITIAL_ELO.L2;
  return LEVEL_INITIAL_ELO.L1;
}

/**
 * 迁移整个 tacticalData
 */
export function migrateTacticalData(tacticalData, motifDataMap = {}) {
  if (!tacticalData?.tactical_maps) {
    return { data: tacticalData, warnings: [], migrated: false };
  }
  
  if (tacticalData.schemaVersion >= SCHEMA_VERSION) {
    return { data: tacticalData, warnings: [], migrated: false };
  }
  
  const allWarnings = [];
  let anyMigrated = false;
  
  const newTacticalMaps = tacticalData.tactical_maps.map(map => {
    const newEncounters = map.encounters.map(encounter => {
      const motifData = motifDataMap[encounter.target_id];
      const result = migrateEncounterData(encounter, motifData);
      
      if (result.warnings.length > 0) {
        allWarnings.push({
          motifId: encounter.target_id,
          motifName: encounter.target_name,
          warnings: result.warnings
        });
      }
      
      if (result.migrated) anyMigrated = true;
      
      return result.data;
    });
    
    return { ...map, encounters: newEncounters };
  });
  
  return {
    data: {
      ...tacticalData,
      tactical_maps: newTacticalMaps,
      schemaVersion: SCHEMA_VERSION
    },
    warnings: allWarnings,
    migrated: anyMigrated
  };
}

/**
 * 兼容层：从 specialties 动态生成 sub_targets 格式
 */
export function getSubTargetsCompat(specialties) {
  if (!specialties || specialties.length === 0) return [];
  
  const levelCounters = { L2: 0, L3: 0, L4: 0 };
  const subTargets = [];
  
  specialties.forEach(spec => {
    spec.variations?.forEach(v => {
      v.master_benchmarks?.forEach(b => {
        const level = b.level;
        levelCounters[level]++;
        
        subTargets.push({
          sub_id: b.legacy_id || `auto_${level}_${levelCounters[level]}`,
          sub_name: v.name,
          level_req: level,
          is_mastered: b.is_mastered || false,
          consecutive_correct: b.consecutive_correct || 0,
          last_practice: b.last_practice || null,
          l2_status: b.l2_status || 'GREEN',
          elo: b.elo || LEVEL_INITIAL_ELO[level]
        });
      });
    });
  });
  
  return subTargets.sort((a, b) => {
    const levelOrder = { L2: 1, L3: 2, L4: 3 };
    return levelOrder[a.level_req] - levelOrder[b.level_req];
  });
}

/**
 * 获取所有 benchmark 的状态统计
 */
export function getBenchmarkStats(specialties) {
  const stats = {
    total: 0,
    mastered: 0,
    inProgress: 0,
    locked: 0,
    byLevel: { L2: { total: 0, mastered: 0 }, L3: { total: 0, mastered: 0 }, L4: { total: 0, mastered: 0 } }
  };
  
  specialties?.forEach(spec => {
    spec.variations?.forEach(v => {
      v.master_benchmarks?.forEach(b => {
        stats.total++;
        stats.byLevel[b.level].total++;
        
        if (b.is_mastered) {
          stats.mastered++;
          stats.byLevel[b.level].mastered++;
        } else if (b.is_locked || b.l2_status === 'RED') {
          stats.locked++;
        } else if (b.consecutive_correct > 0) {
          stats.inProgress++;
        }
      });
    });
  });
  
  return stats;
}

export default {
  SCHEMA_VERSION,
  LEVEL_INITIAL_ELO,
  addLegacyIdsToMotifData,
  migrateEncounterData,
  migrateTacticalData,
  getBenchmarkStats
};
