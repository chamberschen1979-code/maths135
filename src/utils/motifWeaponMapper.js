import tacticalMaps from '../data/tacticalMaps.json';
import strategyLib from '../data/strategy_lib.json';

const motifWeaponMap = {
  'M01': {
    name: '集合、逻辑与复数',
    weapons: ['S-SET-01', 'S-SET-02', 'S-SET-03']
  },
  'M02': {
    name: '不等式性质',
    weapons: ['S-INEQ-02', 'S-INEQ-03', 'S-INEQ-08', 'S-INEQ-09']
  },
  'M03': {
    name: '函数概念与性质',
    weapons: ['S-FUNC-01', 'S-FUNC-02', 'S-FUNC-03', 'S-FUNC-04', 'S-FUNC-05', 'S-FUNC-06', 'S-FUNC-07']
  },
  'M04': {
    name: '指对数函数与运算',
    weapons: ['S-LOG-01', 'S-LOG-02', 'S-LOG-03', 'S-LOG-04', 'S-VIS-01']
  },
  'M05': {
    name: '平面向量',
    weapons: ['S-VEC-01', 'S-VEC-02', 'S-VEC-03', 'S-VEC-04']
  },
  'M06': {
    name: '三角函数基础',
    weapons: ['S-TRIG-01', 'S-TRIG-02', 'S-TRIG-03']
  },
  'M07': {
    name: '解三角形综合',
    weapons: ['S-TRI-01', 'S-TRI-02', 'S-TRI-03', 'S-TRI-04']
  },
  'M08': {
    name: '数列',
    weapons: ['S-SEQ-01', 'S-SEQ-02', 'S-SEQ-03', 'S-SEQ-04', 'S-SEQ-05', 'S-SEQ-06', 'S-SEQ-07']
  },
  'M09': {
    name: '导数基础应用',
    weapons: ['S-DERIV-01', 'S-DERIV-02', 'S-DERIV-03', 'S-DERIV-04']
  },
  'M10': {
    name: '导数综合应用',
    weapons: ['S-DERIV-05', 'S-DERIV-06', 'S-DERIV-07', 'S-DERIV-08']
  },
  'M11': {
    name: '导数压轴',
    weapons: ['S-DERIV-05', 'S-DERIV-06', 'S-DERIV-07', 'S-DERIV-08']
  },
  'M12': {
    name: '立体几何',
    weapons: ['S-GEO-01', 'S-GEO-02', 'S-GEO-03', 'S-GEO-04']
  },
  'M13': {
    name: '概率统计',
    weapons: ['S-PROB-01', 'S-PROB-02', 'S-PROB-03', 'S-PROB-04', 'S-PROB-05']
  },
  'M14': {
    name: '直线与圆',
    weapons: ['S-CIRCLE-01', 'S-CIRCLE-02', 'S-ANALYTIC-01', 'S-ANALYTIC-02']
  },
  'M15': {
    name: '圆锥曲线',
    weapons: ['S-CONIC-01', 'S-CONIC-02', 'S-CONIC-03', 'S-CONIC-04', 'S-ANALYTIC-01', 'S-ANALYTIC-02', 'S-ANALYTIC-03', 'S-ANALYTIC-04']
  },
  'M16': {
    name: '排列组合',
    weapons: ['S-COMB-01', 'S-COMB-02', 'S-COMB-03', 'S-COMB-04']
  },
  'M17': {
    name: '创新题',
    weapons: ['S-INNOV-01', 'S-INNOV-02', 'S-INNOV-03', 'S-INNOV-04']
  }
};

export const getLinkedMotifsForWeapon = (weaponId) => {
  const linkedMotifs = [];
  
  for (const [motifId, data] of Object.entries(motifWeaponMap)) {
    if (data.weapons && data.weapons.includes(weaponId)) {
      linkedMotifs.push({
        id: motifId,
        name: data.name
      });
    }
  }
  
  return linkedMotifs;
};

export const getLinkedWeaponsForMotif = (motifId) => {
  const data = motifWeaponMap[motifId];
  if (!data) return [];
  
  return data.weapons.map(weaponId => {
    const weaponInfo = getWeaponInfo(weaponId);
    return weaponInfo ? {
      id: weaponId,
      name: weaponInfo.name
    } : null;
  }).filter(Boolean);
};

const getWeaponInfo = (weaponId) => {
  const categories = strategyLib.categories;
  
  for (const category of categories) {
    const weapon = category.weapons.find(w => w.id === weaponId);
    if (weapon) {
      return weapon;
    }
  }
  
  return null;
};

export const getMotifInfo = (motifId) => {
  for (const map of tacticalMaps.tactical_maps) {
    const encounter = map.encounters.find(e => e.target_id === motifId);
    if (encounter) {
      return {
        id: motifId,
        name: encounter.target_name
      };
    }
  }
  
  return null;
};

export const isMotifActivated = (motifId, tacticalData) => {
  if (!tacticalData?.tactical_maps) return false
  
  for (const map of tacticalData.tactical_maps) {
    const encounter = map.encounters?.find(e => e.target_id === motifId)
    if (encounter) {
      return encounter.gear_level > 0 || (encounter.elo_score && encounter.elo_score > 1000)
    }
  }
  
  return false
}

export const getWeaponStatus = (weapon, tacticalData) => {
  // 检查是否已认证（从用户数据中获取，而不是硬编码的 _userState）
  const certifiedWeapons = tacticalData?.user_profile?.certifiedWeapons || []
  if (certifiedWeapons.includes(weapon.id)) {
    return 'CERTIFIED'
  }
  
  // 检查关联母题是否激活
  const linkedMotifs = weapon.linked_motifs || []
  const hasActivatedMotif = linkedMotifs.some(m => 
    isMotifActivated(m.id, tacticalData)
  )
  
  if (hasActivatedMotif) {
    return 'UNLOCKED'
  }
  
  return 'LOCKED'
}
